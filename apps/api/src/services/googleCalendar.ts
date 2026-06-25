import { google } from 'googleapis'
import { randomUUID } from 'crypto'

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
  }
  return auth
}

function getCalendarClient() {
  return google.calendar({ version: 'v3', auth: getAuth() })
}

// Criar consulta com Google Meet
export async function createMeetConsultation(params: {
  patientName: string
  guardianName: string
  guardianEmail?: string | null
  scheduledAt: Date
  partnerName?: string | null
}): Promise<{ eventId: string; meetLink: string }> {
  const calendar = getCalendarClient()
  const endTime = new Date(params.scheduledAt.getTime() + 60 * 60 * 1000) // +1h

  const attendees = []
  if (params.guardianEmail) attendees.push({ email: params.guardianEmail })

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    conferenceDataVersion: 1, // necessário para gerar o Meet
    requestBody: {
      summary: `Consulta Pré-Op — ${params.patientName}`,
      description: [
        `Paciente: ${params.patientName}`,
        `Tutor: ${params.guardianName}`,
        params.partnerName ? `Parceiro: ${params.partnerName}` : '',
        '',
        'Consulta pré-operatória - NOVUS Cirurgia Veterinária',
      ].filter(Boolean).join('\n'),
      start: { dateTime: params.scheduledAt.toISOString(), timeZone: 'America/Sao_Paulo' },
      end: { dateTime: endTime.toISOString(), timeZone: 'America/Sao_Paulo' },
      attendees,
      colorId: '9', // azul
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  })

  const meetLink = event.data.conferenceData?.entryPoints?.find(
    (e: any) => e.entryPointType === 'video'
  )?.uri || event.data.hangoutLink || ''

  return { eventId: event.data.id!, meetLink }
}

export async function cancelCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient()
  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    eventId,
  })
}

export async function createCalendarEvent(surgery: {
  id: string
  scheduledDate: Date
  patientName: string
  guardianName: string
  partnerName?: string
  procedure: string
}): Promise<string> {
  const calendar = getCalendarClient()
  const startTime = new Date(surgery.scheduledDate)
  const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000) // +3h padrão

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    requestBody: {
      summary: `Cirurgia - ${surgery.patientName}`,
      description: [
        `Paciente: ${surgery.patientName}`,
        `Tutor: ${surgery.guardianName}`,
        surgery.partnerName ? `Parceiro: ${surgery.partnerName}` : '',
        `Procedimento: ${surgery.procedure}`,
        `ID: ${surgery.id}`,
      ].filter(Boolean).join('\n'),
      start: { dateTime: startTime.toISOString(), timeZone: 'America/Sao_Paulo' },
      end: { dateTime: endTime.toISOString(), timeZone: 'America/Sao_Paulo' },
      colorId: '11', // vermelho para cirurgia
    },
  })

  return event.data.id!
}

export async function updateGoogleCalendarEvent(
  eventId: string,
  update: { status: string; message: string }
): Promise<void> {
  const calendar = getCalendarClient()
  const existing = await calendar.events.get({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    eventId,
  })

  const description = (existing.data.description || '') + `\n[${new Date().toLocaleString('pt-BR')}] ${update.message}`
  await calendar.events.patch({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    eventId,
    requestBody: { description },
  })
}
