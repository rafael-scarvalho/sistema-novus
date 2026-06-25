import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('pt-BR')
}

export const SURGERY_STATUS_LABELS: Record<string, string> = {
  AGENDADA: 'Agendada',
  CHECKIN_REALIZADO: 'Check-in Realizado',
  PREPARACAO_ANESTESICA: 'Preparação Anestésica',
  EM_CIRURGIA: 'Em Cirurgia',
  RECUPERACAO: 'Recuperação',
  ALTA_CONCEDIDA: 'Alta Concedida',
  CANCELADA: 'Cancelada',
}

export const SURGERY_STATUS_COLORS: Record<string, string> = {
  AGENDADA: 'bg-blue-100 text-blue-700',
  CHECKIN_REALIZADO: 'bg-purple-100 text-purple-700',
  PREPARACAO_ANESTESICA: 'bg-yellow-100 text-yellow-700',
  EM_CIRURGIA: 'bg-red-100 text-red-700',
  RECUPERACAO: 'bg-orange-100 text-orange-700',
  ALTA_CONCEDIDA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-gray-100 text-gray-500',
}

export const BUDGET_STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADO: 'Enviado',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
  EXPIRADO: 'Expirado',
}

export const BUDGET_STATUS_COLORS: Record<string, string> = {
  RASCUNHO: 'bg-gray-100 text-gray-600',
  ENVIADO: 'bg-blue-100 text-blue-700',
  APROVADO: 'bg-green-100 text-green-700',
  RECUSADO: 'bg-red-100 text-red-700',
  EXPIRADO: 'bg-yellow-100 text-yellow-700',
}

export const PAYMENT_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito',
  BOLETO: 'Boleto',
  TRANSFERENCIA: 'Transferência',
  PARCELADO: 'Parcelado',
}
