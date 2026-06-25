import { Router } from 'express'
import prisma from '../utils/prisma'
import { requireAuth } from '../middleware/auth'
import { sendWhatsAppStatusMessage } from '../services/whatsapp'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const returns = await prisma.surgeryReturn.findMany({
    include: {
      surgery: { include: { patient: { include: { guardian: true } } } },
    },
    orderBy: { returnDate: 'asc' },
  })
  res.json(returns)
})

router.post('/', async (req, res) => {
  const r = await prisma.surgeryReturn.create({ data: req.body })
  res.status(201).json(r)
})

router.patch('/:id/complete', async (req, res) => {
  const r = await prisma.surgeryReturn.update({
    where: { id: req.params.id },
    data: { status: 'REALIZADO', completedAt: new Date() },
  })
  res.json(r)
})

router.post('/:id/notify', async (req, res) => {
  const r = await prisma.surgeryReturn.findUnique({
    where: { id: req.params.id },
    include: { surgery: { include: { patient: { include: { guardian: true } } } } },
  })
  if (!r) return res.status(404).json({ error: 'Retorno não encontrado' })

  const guardian = r.surgery.patient.guardian
  const phone = guardian.whatsapp || guardian.phone
  const date = new Date(r.returnDate).toLocaleDateString('pt-BR')

  if (phone) {
    await sendWhatsAppStatusMessage(
      phone,
      guardian.name,
      r.surgery.patient.name,
      'RETORNO',
      `Lembramos que o retorno pós-cirúrgico de ${r.surgery.patient.name} está agendado para ${date}. ${r.notes || ''}`
    )
  }

  res.json({ sent: true })
})

export default router
