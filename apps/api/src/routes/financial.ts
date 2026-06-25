import { Router } from 'express'
import prisma from '../utils/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/transactions', async (req, res) => {
  const { type, status, category, from, to } = req.query
  const transactions = await prisma.transaction.findMany({
    where: {
      ...(type ? { type: type as any } : {}),
      ...(status ? { status: status as any } : {}),
      ...(category ? { category: category as any } : {}),
      ...(from || to ? {
        dueDate: {
          ...(from ? { gte: new Date(String(from)) } : {}),
          ...(to ? { lte: new Date(String(to)) } : {}),
        }
      } : {}),
    },
    include: {
      surgery: { include: { patient: true } },
      partner: true,
    },
    orderBy: { dueDate: 'desc' },
  })
  res.json(transactions)
})

router.post('/transactions', async (req, res) => {
  const transaction = await prisma.transaction.create({ data: req.body })
  res.status(201).json(transaction)
})

router.patch('/transactions/:id/pay', async (req, res) => {
  const { paymentMethod, paidAt } = req.body
  const transaction = await prisma.transaction.update({
    where: { id: req.params.id },
    data: { status: 'PAGO', paymentMethod, paidAt: paidAt ? new Date(paidAt) : new Date() },
  })
  res.json(transaction)
})

router.get('/summary', async (req, res) => {
  const { from, to } = req.query
  const dateFilter = from || to ? {
    dueDate: {
      ...(from ? { gte: new Date(String(from)) } : {}),
      ...(to ? { lte: new Date(String(to)) } : {}),
    }
  } : {}

  const [revenue, expenses, pendingReceivables, pendingPayables, pendingSettlements] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: 'ENTRADA', status: 'PAGO', ...dateFilter },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: 'SAIDA', status: 'PAGO', ...dateFilter },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: 'ENTRADA', status: 'PENDENTE' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: 'SAIDA', status: 'PENDENTE' },
      _sum: { amount: true },
    }),
    prisma.partnerSettlement.aggregate({
      where: { status: 'PENDENTE' },
      _sum: { commissionAmount: true },
    }),
  ])

  const totalRevenue = revenue._sum.amount || 0
  const totalExpenses = expenses._sum.amount || 0

  res.json({
    totalRevenue,
    totalExpenses,
    netBalance: totalRevenue - totalExpenses,
    pendingReceivables: pendingReceivables._sum.amount || 0,
    pendingPayables: pendingPayables._sum.amount || 0,
    pendingSettlements: pendingSettlements._sum.commissionAmount || 0,
  })
})

router.get('/settlements', async (req, res) => {
  const settlements = await prisma.partnerSettlement.findMany({
    include: {
      partner: true,
      surgery: { include: { patient: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(settlements)
})

router.patch('/settlements/:id/pay', async (req, res) => {
  const settlement = await prisma.partnerSettlement.update({
    where: { id: req.params.id },
    data: { status: 'PAGO', paidAt: new Date() },
  })
  res.json(settlement)
})

export default router
