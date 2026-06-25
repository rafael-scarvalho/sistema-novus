import { Router } from 'express'
import prisma from '../utils/prisma'
import { requireAuth } from '../middleware/auth'
import { createMeetConsultation, cancelCalendarEvent } from '../services/googleCalendar'
import { sendWhatsAppMeetLink } from '../services/whatsapp'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const { patientId, status } = req.query
  const consultations = await prisma.preOpConsultation.findMany({
    where: {
      ...(patientId ? { patientId: String(patientId) } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: {
      patient: { include: { guardian: true } },
      partner: true,
    },
    orderBy: { scheduledAt: 'asc' },
  })
  res.json(consultations)
})

router.get('/:id', async (req, res) => {
  const c = await prisma.preOpConsultation.findUnique({
    where: { id: req.params.id },
    include: { patient: { include: { guardian: true } }, partner: true },
  })
  if (!c) return res.status(404).json({ error: 'Consulta não encontrada' })
  res.json(c)
})

// Criar consulta (presencial ou online com Google Meet)
router.post('/', async (req, res) => {
  const { patientId, partnerId, scheduledAt, mode, ...rest } = req.body

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { guardian: true },
  })
  if (!patient) return res.status(404).json({ error: 'Paciente não encontrado' })

  let googleCalendarEventId: string | undefined
  let googleMeetLink: string | undefined

  // Se for online, cria evento no Google Calendar com Meet
  if (mode === 'ONLINE') {
    try {
      const partner = partnerId
        ? await prisma.partner.findUnique({ where: { id: partnerId } })
        : null

      const result = await createMeetConsultation({
        patientName: patient.name,
        guardianName: patient.guardian.name,
        guardianEmail: patient.guardian.email,
        scheduledAt: new Date(scheduledAt),
        partnerName: partner?.name,
      })
      googleCalendarEventId = result.eventId
      googleMeetLink = result.meetLink
    } catch (err) {
      console.error('Erro ao criar evento Google Meet:', err)
    }
  }

  const consultation = await prisma.preOpConsultation.create({
    data: {
      patientId,
      partnerId: partnerId || undefined,
      scheduledAt: new Date(scheduledAt),
      mode,
      googleCalendarEventId,
      googleMeetLink,
      ...rest,
    },
    include: { patient: { include: { guardian: true } }, partner: true },
  })

  // Envia link do Meet por WhatsApp automaticamente
  if (googleMeetLink && (patient.guardian.whatsapp || patient.guardian.phone)) {
    try {
      await sendWhatsAppMeetLink(
        patient.guardian.whatsapp || patient.guardian.phone!,
        patient.guardian.name,
        patient.name,
        new Date(scheduledAt),
        googleMeetLink
      )
    } catch (err) {
      console.error('Erro ao enviar WhatsApp:', err)
    }
  }

  res.status(201).json(consultation)
})

// Atualizar dados clínicos da consulta
router.put('/:id', async (req, res) => {
  const c = await prisma.preOpConsultation.update({
    where: { id: req.params.id },
    data: req.body,
    include: { patient: { include: { guardian: true } }, partner: true },
  })
  res.json(c)
})

// Atualizar status de jornada do paciente
router.patch('/:id/workflow', async (req, res) => {
  const { workflowStatus } = req.body
  const c = await prisma.preOpConsultation.update({
    where: { id: req.params.id },
    data: { workflowStatus },
    include: { patient: { include: { guardian: true } }, partner: true },
  })
  res.json(c)
})

// Marcar como realizada
router.patch('/:id/complete', async (req, res) => {
  const c = await prisma.preOpConsultation.update({
    where: { id: req.params.id },
    data: { status: 'REALIZADA' },
  })
  res.json(c)
})

// Cancelar
router.patch('/:id/cancel', async (req, res) => {
  const c = await prisma.preOpConsultation.findUnique({ where: { id: req.params.id } })
  if (!c) return res.status(404).json({ error: 'Consulta não encontrada' })

  if (c.googleCalendarEventId) {
    try { await cancelCalendarEvent(c.googleCalendarEventId) } catch {}
  }

  const updated = await prisma.preOpConsultation.update({
    where: { id: req.params.id },
    data: { status: 'CANCELADA' },
  })
  res.json(updated)
})

// Reenviar link do Meet por WhatsApp
router.post('/:id/send-meet', async (req, res) => {
  const c = await prisma.preOpConsultation.findUnique({
    where: { id: req.params.id },
    include: { patient: { include: { guardian: true } } },
  })
  if (!c) return res.status(404).json({ error: 'Consulta não encontrada' })
  if (!c.googleMeetLink) return res.status(400).json({ error: 'Consulta não possui link do Meet' })

  const guardian = c.patient.guardian
  const phone = guardian.whatsapp || guardian.phone
  if (!phone) return res.status(400).json({ error: 'Tutor sem telefone cadastrado' })

  await sendWhatsAppMeetLink(phone, guardian.name, c.patient.name, c.scheduledAt, c.googleMeetLink)
  res.json({ sent: true })
})

export default router
