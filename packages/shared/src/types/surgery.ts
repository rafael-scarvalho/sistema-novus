export type SurgeryStatus =
  | 'AGENDADA'
  | 'CHECKIN_REALIZADO'
  | 'PREPARACAO_ANESTESICA'
  | 'EM_CIRURGIA'
  | 'RECUPERACAO'
  | 'ALTA_CONCEDIDA'
  | 'CANCELADA'

export interface SurgeryStatusUpdate {
  id: string
  surgeryId: string
  status: SurgeryStatus
  message: string
  notifiedWhatsapp: boolean
  notifiedAt?: string
  createdAt: string
}

export interface SurgeryPreOp {
  anamnesis?: string
  requiredExams?: string[]
  anestheticRisk?: 'BAIXO' | 'MODERADO' | 'ALTO'
  anestheticProtocol?: string
  observations?: string
  examFiles?: string[]
}

export interface SurgeryTransOp {
  startTime?: string
  endTime?: string
  team?: string[]
  techniques?: string
  intercurrences?: string
  anesthesiaNotes?: string
}

export interface SurgeryPostOp {
  recoveryNotes?: string
  prescriptions?: string
  returnDate?: string
  dischargeSummary?: string
  reportFiles?: string[]
}

export interface Surgery {
  id: string
  budgetId: string
  patientId: string
  partnerId?: string
  scheduledDate: string
  status: SurgeryStatus
  preOp: SurgeryPreOp
  transOp: SurgeryTransOp
  postOp: SurgeryPostOp
  statusHistory: SurgeryStatusUpdate[]
  googleCalendarEventId?: string
  createdAt: string
  updatedAt: string
}

export type CreateSurgeryDto = {
  budgetId: string
  patientId: string
  partnerId?: string
  scheduledDate: string
  preOp?: SurgeryPreOp
}
