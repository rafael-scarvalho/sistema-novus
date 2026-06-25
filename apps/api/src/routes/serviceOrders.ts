import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import prisma from '../utils/prisma'

const router = Router()
router.use(authMiddleware)

const include = {
  vet: { select: { id: true, name: true, commissionRate: true } },
  patient: { select: { id: true, name: true } },
  items: { include: { catalogItem: { select: { id: true, name: true } } } },
}

// Lista OSs de um paciente
router.get('/patient/:patientId', async (req, res) => {
  const orders = await prisma.serviceOrder.findMany({
    where: { patientId: req.params.patientId },
    include,
    orderBy: { createdAt: 'desc' },
  })
  res.json(orders)
})

// Lista todas as OSs (com filtros opcionais)
router.get('/', async (req, res) => {
  const { vetId, status, from, to } = req.query
  const where: Record<string, unknown> = {}
  if (vetId) where.vetId = vetId
  if (status) where.status = status
  if (from || to) {
    where.createdAt = {}
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from as string)
    if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to as string)
  }
  const orders = await prisma.serviceOrder.findMany({
    where,
    include,
    orderBy: { createdAt: 'desc' },
  })
  res.json(orders)
})

// Cria OS com itens
router.post('/', async (req, res) => {
  const { patientId, vetId, notes, items } = req.body

  const vet = await prisma.user.findUnique({ where: { id: vetId } })
  if (!vet) return res.status(404).json({ error: 'Veterinário não encontrado' })

  const commissionRate = vet.commissionRate

  const calculatedItems = (items as Array<{
    catalogItemId?: string; name: string; quantity: number; unitPrice: number
  }>).map(item => {
    const total = item.quantity * item.unitPrice
    const commissionAmount = total * (commissionRate / 100)
    return { ...item, commissionRate, commissionAmount, total }
  })

  const total = calculatedItems.reduce((s, i) => s + i.total, 0)
  const totalCommission = calculatedItems.reduce((s, i) => s + i.commissionAmount, 0)

  const order = await prisma.serviceOrder.create({
    data: {
      patientId,
      vetId,
      notes,
      total,
      totalCommission,
      items: { create: calculatedItems },
    },
    include,
  })
  res.status(201).json(order)
})

// Adiciona item a OS existente
router.post('/:id/items', async (req, res) => {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: req.params.id },
    include: { vet: true },
  })
  if (!order) return res.status(404).json({ error: 'OS não encontrada' })
  if (order.status !== 'ABERTA') return res.status(400).json({ error: 'OS não está aberta' })

  const { catalogItemId, name, quantity, unitPrice } = req.body
  const total = quantity * unitPrice
  const commissionRate = order.vet.commissionRate
  const commissionAmount = total * (commissionRate / 100)

  await prisma.serviceOrderItem.create({
    data: { serviceOrderId: order.id, catalogItemId, name, quantity, unitPrice, commissionRate, commissionAmount, total },
  })

  const items = await prisma.serviceOrderItem.findMany({ where: { serviceOrderId: order.id } })
  const newTotal = items.reduce((s, i) => s + i.total, 0)
  const newCommission = items.reduce((s, i) => s + i.commissionAmount, 0)

  const updated = await prisma.serviceOrder.update({
    where: { id: order.id },
    data: { total: newTotal, totalCommission: newCommission },
    include,
  })
  res.json(updated)
})

// Remove item
router.delete('/:id/items/:itemId', async (req, res) => {
  const order = await prisma.serviceOrder.findUnique({ where: { id: req.params.id } })
  if (!order) return res.status(404).json({ error: 'OS não encontrada' })
  if (order.status !== 'ABERTA') return res.status(400).json({ error: 'OS não está aberta' })

  await prisma.serviceOrderItem.delete({ where: { id: req.params.itemId } })

  const items = await prisma.serviceOrderItem.findMany({ where: { serviceOrderId: order.id } })
  const newTotal = items.reduce((s, i) => s + i.total, 0)
  const newCommission = items.reduce((s, i) => s + i.commissionAmount, 0)

  const updated = await prisma.serviceOrder.update({
    where: { id: order.id },
    data: { total: newTotal, totalCommission: newCommission },
    include,
  })
  res.json(updated)
})

// Fecha / paga OS
router.patch('/:id/status', async (req, res) => {
  const { status, paymentMethod } = req.body
  const data: Record<string, unknown> = { status }
  if (status === 'PAGA') {
    data.paidAt = new Date()
    data.paymentMethod = paymentMethod
  }
  const updated = await prisma.serviceOrder.update({
    where: { id: req.params.id },
    data,
    include,
  })
  res.json(updated)
})

// Relatório de comissões por veterinário
router.get('/report/commissions', async (req, res) => {
  const { from, to } = req.query
  const where: Record<string, unknown> = { status: { in: ['FECHADA', 'PAGA'] } }
  if (from || to) {
    where.createdAt = {}
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from as string)
    if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to as string)
  }

  const orders = await prisma.serviceOrder.findMany({
    where,
    include: { vet: { select: { id: true, name: true, commissionRate: true } } },
  })

  const byVet = orders.reduce<Record<string, { vet: { id: string; name: string; commissionRate: number }; totalRevenue: number; totalCommission: number; count: number }>>((acc, o) => {
    if (!acc[o.vetId]) acc[o.vetId] = { vet: o.vet, totalRevenue: 0, totalCommission: 0, count: 0 }
    acc[o.vetId].totalRevenue += o.total
    acc[o.vetId].totalCommission += o.totalCommission
    acc[o.vetId].count++
    return acc
  }, {})

  res.json(Object.values(byVet))
})

export default router
