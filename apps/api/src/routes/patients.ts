import { Router } from 'express'
import prisma from '../utils/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const { search } = req.query
  const patients = await prisma.patient.findMany({
    where: search ? {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' } },
        { guardian: { name: { contains: String(search), mode: 'insensitive' } } },
      ]
    } : undefined,
    include: { guardian: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(patients)
})

router.get('/:id', async (req, res) => {
  const patient = await prisma.patient.findUnique({
    where: { id: req.params.id },
    include: {
      guardian: true,
      surgeries: { orderBy: { scheduledDate: 'desc' }, take: 5 },
      budgets: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
  if (!patient) return res.status(404).json({ error: 'Paciente não encontrado' })
  res.json(patient)
})

router.post('/', async (req, res) => {
  const patient = await prisma.patient.create({ data: req.body, include: { guardian: true } })
  res.status(201).json(patient)
})

router.put('/:id', async (req, res) => {
  const patient = await prisma.patient.update({
    where: { id: req.params.id },
    data: req.body,
    include: { guardian: true },
  })
  res.json(patient)
})

export default router
