import { Router } from 'express'
import prisma from '../utils/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 3600 * 1000)
  const endOfWeek = new Date(startOfDay.getTime() + 7 * 24 * 3600 * 1000)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const [
    surgeriesDay,
    surgeriesActive,
    returnsWeek,
    consultationsDay,
    pendingExams,
    pendingBudgets,
    revenueMonth,
    surgeriesMonthCount,
    expensesMonth,
    surgeriesMonthChart,
  ] = await Promise.all([
    prisma.surgery.findMany({
      where: { scheduledDate: { gte: startOfDay, lt: endOfDay } },
      include: { patient: { include: { guardian: true } }, budget: true },
      orderBy: { scheduledDate: 'asc' },
    }),
    prisma.surgery.findMany({
      where: { status: { in: ['CHECKIN_REALIZADO', 'PREPARACAO_ANESTESICA', 'EM_CIRURGIA', 'RECUPERACAO', 'INTERNACAO'] } },
      include: { patient: { include: { guardian: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.surgeryReturn.findMany({
      where: { returnDate: { gte: startOfDay, lte: endOfWeek }, status: 'PENDENTE' },
      include: { surgery: { include: { patient: true } } },
      orderBy: { returnDate: 'asc' },
    }),
    prisma.preOpConsultation.findMany({
      where: { scheduledAt: { gte: startOfDay, lt: endOfDay }, status: 'AGENDADA' },
      include: { patient: { include: { guardian: true } } },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.preOpConsultation.findMany({
      where: { workflowStatus: 'EXAMES_PRE_OP', status: { not: 'CANCELADA' } },
      include: { patient: { include: { guardian: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.budget.findMany({
      where: { status: 'ENVIADO' },
      include: { patient: { include: { guardian: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.transaction.aggregate({
      where: { type: 'ENTRADA', status: 'PAGO', dueDate: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.surgery.count({
      where: { scheduledDate: { gte: startOfMonth, lte: endOfMonth }, status: { not: 'CANCELADA' } },
    }),
    prisma.transaction.aggregate({
      where: { type: 'SAIDA', status: 'PAGO', dueDate: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    // Últimos 6 meses de cirurgias para gráfico
    Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1)
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        return prisma.surgery.count({
          where: { scheduledDate: { gte: d, lte: end }, status: { not: 'CANCELADA' } },
        }).then(count => ({
          month: d.toLocaleDateString('pt-BR', { month: 'short' }),
          count,
        }))
      })
    ),
  ])

  res.json({
    today: { surgeries: surgeriesDay, consultations: consultationsDay, date: today.toISOString() },
    active: surgeriesActive,
    returnsWeek,
    pendingExams,
    pendingBudgets,
    month: {
      revenue: revenueMonth._sum.amount || 0,
      expenses: expensesMonth._sum.amount || 0,
      surgeries: surgeriesMonthCount,
    },
    chart: surgeriesMonthChart,
  })
})

// Busca global
router.get('/search', async (req, res) => {
  const { q } = req.query
  if (!q || String(q).length < 2) return res.json({ patients: [], surgeries: [], budgets: [] })

  const term = String(q)

  const [patients, surgeries, budgets] = await Promise.all([
    prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { guardian: { name: { contains: term, mode: 'insensitive' } } },
          { guardian: { phone: { contains: term } } },
        ],
      },
      include: { guardian: true },
      take: 5,
    }),
    prisma.surgery.findMany({
      where: {
        OR: [
          { patient: { name: { contains: term, mode: 'insensitive' } } },
          { patient: { guardian: { name: { contains: term, mode: 'insensitive' } } } },
        ],
      },
      include: { patient: { include: { guardian: true } } },
      take: 5,
      orderBy: { scheduledDate: 'desc' },
    }),
    prisma.budget.findMany({
      where: {
        OR: [
          { code: { contains: term, mode: 'insensitive' } },
          { patient: { name: { contains: term, mode: 'insensitive' } } },
        ],
      },
      include: { patient: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  res.json({ patients, surgeries, budgets })
})

export default router
