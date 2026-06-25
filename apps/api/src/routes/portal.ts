import { Router } from 'express'
import prisma from '../utils/prisma'

const router = Router()

// Rota pública — acesso via token do tutor
router.get('/:token', async (req, res) => {
  const guardian = await prisma.guardian.findUnique({
    where: { portalToken: req.params.token },
    include: {
      patients: {
        include: {
          surgeries: {
            orderBy: { scheduledDate: 'desc' },
            include: {
              statusHistory: { orderBy: { createdAt: 'asc' } },
            },
          },
        },
      },
    },
  })

  if (!guardian) return res.status(404).json({ error: 'Link inválido ou expirado' })
  if (guardian.portalTokenExpiry && guardian.portalTokenExpiry < new Date()) {
    return res.status(401).json({ error: 'Link expirado. Solicite um novo acesso.' })
  }

  res.json({
    guardian: { name: guardian.name, email: guardian.email },
    patients: guardian.patients,
  })
})

// Baixar laudo/exame via portal do tutor
router.get('/:token/surgery/:surgeryId/files/:filename', async (req, res) => {
  const guardian = await prisma.guardian.findUnique({
    where: { portalToken: req.params.token },
  })
  if (!guardian || (guardian.portalTokenExpiry && guardian.portalTokenExpiry < new Date())) {
    return res.status(401).json({ error: 'Acesso não autorizado' })
  }

  const surgery = await prisma.surgery.findFirst({
    where: { id: req.params.surgeryId, patient: { guardianId: guardian.id } },
  })
  if (!surgery) return res.status(403).json({ error: 'Acesso negado' })

  const uploadDir = process.env.UPLOAD_DIR || './uploads'
  res.sendFile(req.params.filename, { root: uploadDir })
})

export default router
