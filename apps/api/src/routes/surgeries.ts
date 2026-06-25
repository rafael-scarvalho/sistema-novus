import { Router } from 'express'
import prisma from '../utils/prisma'
import { requireAuth } from '../middleware/auth'
import { io } from '../server'
import { sendWhatsAppStatusMessage } from '../services/whatsapp'
import { updateGoogleCalendarEvent } from '../services/googleCalendar'
import multer from 'multer'
import path from 'path'

const router = Router()
router.use(requireAuth)

const upload = multer({
  dest: process.env.UPLOAD_DIR || './uploads',
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.docx']
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()))
  },
})

const STATUS_MESSAGES: Record<string, string> = {
  AGENDADA: 'Cirurgia agendada com sucesso.',
  CHECKIN_REALIZADO: 'Check-in realizado. Seu pet está nos nossos cuidados.',
  PREPARACAO_ANESTESICA: 'Iniciando a preparação anestésica do seu pet.',
  EM_CIRURGIA: 'A cirurgia começou. Nossa equipe está trabalhando com todo cuidado.',
  RECUPERACAO: 'Cirurgia concluída com sucesso! Seu pet está em recuperação.',
  ALTA_CONCEDIDA: 'Alta concedida! Seu pet está pronto para ir para casa.',
  CANCELADA: 'A cirurgia foi cancelada. Entre em contato para mais informações.',
}

router.get('/', async (req, res) => {
  const { status, patientId } = req.query
  const surgeries = await prisma.surgery.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(patientId ? { patientId: String(patientId) } : {}),
    },
    include: {
      patient: { include: { guardian: true } },
      partner: true,
      budget: { select: { code: true, total: true } },
      statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { scheduledDate: 'asc' },
  })
  res.json(surgeries)
})

router.get('/:id', async (req, res) => {
  const surgery = await prisma.surgery.findUnique({
    where: { id: req.params.id },
    include: {
      patient: { include: { guardian: true } },
      partner: true,
      budget: { include: { items: true, paymentOptions: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
      settlement: true,
    },
  })
  if (!surgery) return res.status(404).json({ error: 'Cirurgia não encontrada' })
  res.json(surgery)
})

// Atualizar status da cirurgia com notificações em tempo real
router.post('/:id/status', async (req, res) => {
  const { status, customMessage } = req.body
  const surgery = await prisma.surgery.findUnique({
    where: { id: req.params.id },
    include: { patient: { include: { guardian: true } } },
  })
  if (!surgery) return res.status(404).json({ error: 'Cirurgia não encontrada' })

  const message = customMessage || STATUS_MESSAGES[status] || `Status atualizado: ${status}`

  const [updatedSurgery, statusUpdate] = await prisma.$transaction(async (tx) => {
    const upd = await tx.surgery.update({
      where: { id: req.params.id },
      data: { status },
    })
    const su = await tx.surgeryStatusUpdate.create({
      data: { surgeryId: req.params.id, status, message, notifiedWhatsapp: false },
    })
    return [upd, su]
  })

  // Emite evento WebSocket para o frontend em tempo real
  io.to(`surgery:${req.params.id}`).emit('surgery:status', {
    surgeryId: req.params.id,
    status,
    message,
    timestamp: new Date(),
  })

  // Envia WhatsApp se o tutor tiver número
  const guardian = surgery.patient.guardian
  const whatsappNumber = guardian.whatsapp || guardian.phone
  if (whatsappNumber) {
    try {
      await sendWhatsAppStatusMessage(whatsappNumber, guardian.name, surgery.patient.name, status, message)
      await prisma.surgeryStatusUpdate.update({
        where: { id: statusUpdate.id },
        data: { notifiedWhatsapp: true, notifiedAt: new Date() },
      })
    } catch (err) {
      console.error('Erro ao enviar WhatsApp:', err)
    }
  }

  // Atualiza Google Calendar se houver evento vinculado
  if (surgery.googleCalendarEventId) {
    try {
      await updateGoogleCalendarEvent(surgery.googleCalendarEventId, { status, message })
    } catch (err) {
      console.error('Erro ao atualizar Google Calendar:', err)
    }
  }

  res.json({ surgery: updatedSurgery, statusUpdate })
})

// Atualizar dados pré-op
router.put('/:id/pre-op', async (req, res) => {
  const surgery = await prisma.surgery.update({
    where: { id: req.params.id },
    data: {
      preOpAnamnesis: req.body.anamnesis,
      preOpRequiredExams: req.body.requiredExams || [],
      preOpAnestheticRisk: req.body.anestheticRisk,
      preOpAnestheticProtocol: req.body.anestheticProtocol,
      preOpObservations: req.body.observations,
    },
  })
  res.json(surgery)
})

// Atualizar dados trans-op
router.put('/:id/trans-op', async (req, res) => {
  const surgery = await prisma.surgery.update({
    where: { id: req.params.id },
    data: {
      transOpStartTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
      transOpEndTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      transOpTeam: req.body.team || [],
      transOpTechniques: req.body.techniques,
      transOpIntercurrences: req.body.intercurrences,
      transOpAnesthesiaNotes: req.body.anesthesiaNotes,
    },
  })
  res.json(surgery)
})

// Atualizar dados pós-op
router.put('/:id/post-op', async (req, res) => {
  const surgery = await prisma.surgery.update({
    where: { id: req.params.id },
    data: {
      postOpRecoveryNotes: req.body.recoveryNotes,
      postOpPrescriptions: req.body.prescriptions,
      postOpReturnDate: req.body.returnDate ? new Date(req.body.returnDate) : undefined,
      postOpDischargeSummary: req.body.dischargeSummary,
    },
  })
  res.json(surgery)
})

// Upload de laudos/exames
router.post('/:id/files', upload.array('files', 10), async (req, res) => {
  const { type } = req.query // 'pre-op' | 'post-op'
  const files = (req.files as Express.Multer.File[]).map((f) => f.filename)
  const surgery = await prisma.surgery.findUnique({ where: { id: req.params.id } })
  if (!surgery) return res.status(404).json({ error: 'Cirurgia não encontrada' })

  const updated = await prisma.surgery.update({
    where: { id: req.params.id },
    data: type === 'post-op'
      ? { postOpReportFiles: [...surgery.postOpReportFiles, ...files] }
      : { preOpExamFiles: [...surgery.preOpExamFiles, ...files] },
  })
  res.json({ files, surgery: updated })
})

// Agendamento direto (sem orçamento obrigatório)
router.post('/direct', async (req, res) => {
  const { patientId, budgetId, partnerId, scheduledDate } = req.body
  const patient = await prisma.patient.findUnique({ where: { id: patientId } })
  if (!patient) return res.status(404).json({ error: 'Paciente não encontrado' })

  const surgery = await prisma.surgery.create({
    data: {
      patientId,
      partnerId: partnerId || undefined,
      scheduledDate: new Date(scheduledDate),
      status: 'AGENDADA',
      preOpRequiredExams: [],
      preOpExamFiles: [],
      transOpTeam: [],
      postOpReportFiles: [],
      ...(budgetId ? { budgetId } : { budgetId: await createPlaceholderBudget(patientId) }),
    },
    include: { patient: { include: { guardian: true } }, partner: true },
  })
  res.status(201).json(surgery)
})

async function createPlaceholderBudget(patientId: string) {
  const count = await prisma.budget.count()
  const b = await prisma.budget.create({
    data: {
      code: `ORC-${String(count + 1).padStart(5, '0')}`,
      patientId,
      status: 'RASCUNHO',
      subtotal: 0, discount: 0, total: 0,
    },
  })
  return b.id
}

// Agendar retorno pós-op
router.post('/:id/return', async (req, res) => {
  const { returnDate, notes } = req.body
  const surgery = await prisma.surgery.findUnique({ where: { id: req.params.id } })
  if (!surgery) return res.status(404).json({ error: 'Cirurgia não encontrada' })

  const r = await prisma.surgeryReturn.create({
    data: { surgeryId: req.params.id, returnDate: new Date(returnDate), notes },
  })

  if (returnDate) {
    await prisma.surgery.update({
      where: { id: req.params.id },
      data: { postOpReturnDate: new Date(returnDate) },
    })
  }

  res.status(201).json(r)
})

export default router
