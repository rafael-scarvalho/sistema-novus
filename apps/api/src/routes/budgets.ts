import { Router } from 'express'
import prisma from '../utils/prisma'
import { requireAuth } from '../middleware/auth'
import { generateBudgetPdf } from '../services/pdf'
import { sendWhatsAppBudget } from '../services/whatsapp'

const router = Router()
router.use(requireAuth)

async function generateBudgetCode(): Promise<string> {
  const count = await prisma.budget.count()
  return `ORC-${String(count + 1).padStart(5, '0')}`
}

router.get('/', async (req, res) => {
  const { status, patientId } = req.query
  const budgets = await prisma.budget.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(patientId ? { patientId: String(patientId) } : {}),
    },
    include: {
      patient: { include: { guardian: true } },
      partner: true,
      items: true,
      paymentOptions: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(budgets)
})

router.get('/:id', async (req, res) => {
  const budget = await prisma.budget.findUnique({
    where: { id: req.params.id },
    include: {
      patient: { include: { guardian: true } },
      partner: true,
      items: { include: { catalogItem: true } },
      paymentOptions: true,
      surgery: true,
    },
  })
  if (!budget) return res.status(404).json({ error: 'Orçamento não encontrado' })
  res.json(budget)
})

router.post('/', async (req, res) => {
  const { items, paymentOptions, ...budgetData } = req.body

  const subtotal = items.reduce((sum: number, item: any) => {
    return sum + (item.quantity * item.unitPrice - (item.discount || 0))
  }, 0)

  const code = await generateBudgetCode()

  const budget = await prisma.budget.create({
    data: {
      ...budgetData,
      code,
      subtotal,
      total: subtotal - (budgetData.discount || 0),
      items: {
        create: items.map((item: any) => ({
          ...item,
          total: item.quantity * item.unitPrice - (item.discount || 0),
        })),
      },
      paymentOptions: { create: paymentOptions },
    },
    include: {
      patient: { include: { guardian: true } },
      partner: true,
      items: { include: { catalogItem: true } },
      paymentOptions: true,
    },
  })
  res.status(201).json(budget)
})

// Aprovar orçamento → cria cirurgia + lançamento financeiro automaticamente
router.post('/:id/approve', async (req, res) => {
  const { approvedPaymentMethod, scheduledDate } = req.body
  const budget = await prisma.budget.findUnique({
    where: { id: req.params.id },
    include: { partner: true },
  })
  if (!budget) return res.status(404).json({ error: 'Orçamento não encontrado' })

  const [updatedBudget, surgery, transaction] = await prisma.$transaction(async (tx) => {
    const updated = await tx.budget.update({
      where: { id: req.params.id },
      data: { status: 'APROVADO', approvedPaymentMethod, approvedAt: new Date() },
    })

    const surg = await tx.surgery.create({
      data: {
        budgetId: budget.id,
        patientId: budget.patientId,
        partnerId: budget.partnerId,
        scheduledDate: new Date(scheduledDate),
        status: 'AGENDADA',
        preOpRequiredExams: [],
        preOpExamFiles: [],
        transOpTeam: [],
        postOpReportFiles: [],
      },
    })

    // Lança entrada no fluxo de caixa
    const txn = await tx.transaction.create({
      data: {
        type: 'ENTRADA',
        category: 'CIRURGIA',
        description: `Cirurgia - ${budget.code}`,
        amount: budget.total,
        status: 'PENDENTE',
        dueDate: new Date(scheduledDate),
        paymentMethod: approvedPaymentMethod,
        budgetId: budget.id,
        surgeryId: surg.id,
        partnerId: budget.partnerId,
      },
    })

    // Cria repasse ao parceiro se houver
    if (budget.partner && budget.partner.commissionType !== 'NENHUM') {
      const commissionAmount = budget.partner.commissionType === 'PERCENTUAL'
        ? budget.total * (budget.partner.commissionValue / 100)
        : budget.partner.commissionValue

      await tx.partnerSettlement.create({
        data: {
          partnerId: budget.partnerId!,
          surgeryId: surg.id,
          grossAmount: budget.total,
          commissionType: budget.partner.commissionType,
          commissionValue: budget.partner.commissionValue,
          commissionAmount,
          netAmount: budget.total - commissionAmount,
          status: 'PENDENTE',
        },
      })

      await tx.transaction.create({
        data: {
          type: 'SAIDA',
          category: 'REPASSE_PARCEIRO',
          description: `Repasse parceiro - ${budget.partner.name} (${budget.code})`,
          amount: commissionAmount,
          status: 'PENDENTE',
          dueDate: new Date(scheduledDate),
          surgeryId: surg.id,
          partnerId: budget.partnerId,
        },
      })
    }

    return [updated, surg, txn]
  })

  res.json({ budget: updatedBudget, surgery, transaction })
})

// Enviar orçamento por WhatsApp
router.post('/:id/send-whatsapp', async (req, res) => {
  const budget = await prisma.budget.findUnique({
    where: { id: req.params.id },
    include: {
      patient: { include: { guardian: true } },
      partner: true,
      items: true,
      paymentOptions: true,
    },
  })
  if (!budget) return res.status(404).json({ error: 'Orçamento não encontrado' })

  const guardian = budget.patient.guardian
  const phone = guardian.whatsapp || guardian.phone
  if (!phone) return res.status(400).json({ error: 'Tutor não possui telefone cadastrado' })

  await sendWhatsAppBudget(phone, guardian.name, budget as any)

  await prisma.budget.update({
    where: { id: req.params.id },
    data: { status: 'ENVIADO' },
  })

  res.json({ sent: true })
})

// Gerar PDF do orçamento
router.get('/:id/pdf', async (req, res) => {
  const budget = await prisma.budget.findUnique({
    where: { id: req.params.id },
    include: {
      patient: { include: { guardian: true } },
      partner: true,
      items: { include: { catalogItem: true } },
      paymentOptions: true,
    },
  })
  if (!budget) return res.status(404).json({ error: 'Orçamento não encontrado' })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=orcamento-${budget.code}.pdf`)
  const stream = await generateBudgetPdf(budget as any)
  stream.pipe(res)
})

export default router
