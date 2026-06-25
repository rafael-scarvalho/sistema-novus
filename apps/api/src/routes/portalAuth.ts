import { Router, Request, Response, NextFunction } from 'express'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma'
import { sendWhatsAppPortalCredentials } from '../services/whatsapp'

const router = Router()

export interface PortalRequest extends Request {
  guardianId?: string
}

export function requirePortalAuth(req: PortalRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token não fornecido' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { guardianId: string; scope: string }
    if (payload.scope !== 'GUARDIAN_PORTAL') return res.status(403).json({ error: 'Acesso não autorizado' })
    req.guardianId = payload.guardianId
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

// Login do tutor
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Login e senha obrigatórios' })

  const guardian = await prisma.guardian.findUnique({ where: { portalUsername: username } })
  if (!guardian || !guardian.portalPasswordHash) return res.status(401).json({ error: 'Usuário ou senha inválidos' })
  if (!guardian.portalActive) return res.status(403).json({ error: 'Acesso desativado. Entre em contato com a clínica.' })

  const valid = await bcrypt.compare(password, guardian.portalPasswordHash)
  if (!valid) return res.status(401).json({ error: 'Usuário ou senha inválidos' })

  const token = jwt.sign(
    { guardianId: guardian.id, scope: 'GUARDIAN_PORTAL' },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  res.json({
    token,
    guardian: {
      id: guardian.id,
      name: guardian.name,
      email: guardian.email,
    },
  })
})

// Dados do tutor logado
router.get('/me', requirePortalAuth, async (req: PortalRequest, res) => {
  const guardian = await prisma.guardian.findUnique({
    where: { id: req.guardianId },
    include: {
      patients: {
        include: {
          surgeries: {
            include: { statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 } },
            orderBy: { scheduledDate: 'desc' },
          },
          budgets: {
            where: { status: { in: ['ENVIADO', 'APROVADO'] } },
            orderBy: { createdAt: 'desc' },
          },
          records: {
            where: {
              type: { in: ['SURGERY_REPORT', 'EXAM_REPORT', 'DOCUMENT'] },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  })
  if (!guardian) return res.status(404).json({ error: 'Tutor não encontrado' })
  res.json(guardian)
})

// Detalhes de um paciente (documentos, cirurgias, orçamentos)
router.get('/paciente/:patientId', requirePortalAuth, async (req: PortalRequest, res) => {
  const patient = await prisma.patient.findUnique({
    where: { id: req.params.patientId },
    include: {
      guardian: true,
      budgets: {
        where: { status: { in: ['ENVIADO', 'APROVADO'] } },
        include: { items: true, paymentOptions: true },
        orderBy: { createdAt: 'desc' },
      },
      surgeries: {
        include: {
          statusHistory: { orderBy: { createdAt: 'asc' } },
          budget: { include: { items: true, paymentOptions: true } },
        },
        orderBy: { scheduledDate: 'desc' },
      },
      records: {
        where: {
          type: { in: ['SURGERY_REPORT', 'EXAM_REPORT', 'DOCUMENT', 'EXAM_REQUEST', 'PRESCRIPTION'] },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!patient) return res.status(404).json({ error: 'Paciente não encontrado' })
  if (patient.guardianId !== req.guardianId) return res.status(403).json({ error: 'Acesso não autorizado' })

  res.json(patient)
})

export default router
