export type TransactionType = 'ENTRADA' | 'SAIDA'
export type TransactionCategory =
  | 'CIRURGIA'
  | 'CONSULTA'
  | 'MATERIAL'
  | 'REPASSE_PARCEIRO'
  | 'IMPOSTO'
  | 'SALARIO'
  | 'EQUIPAMENTO'
  | 'OUTRO'

export type TransactionStatus = 'PENDENTE' | 'PAGO' | 'CANCELADO'

export interface Transaction {
  id: string
  type: TransactionType
  category: TransactionCategory
  description: string
  amount: number
  status: TransactionStatus
  dueDate: string
  paidAt?: string
  paymentMethod?: string
  surgeryId?: string
  budgetId?: string
  partnerId?: string
  notes?: string
  createdAt: string
}

export interface PartnerSettlement {
  id: string
  partnerId: string
  surgeryId: string
  grossAmount: number
  commissionType: string
  commissionValue: number
  commissionAmount: number
  netAmount: number
  status: TransactionStatus
  paidAt?: string
  createdAt: string
}

export interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netBalance: number
  pendingReceivables: number
  pendingPayables: number
  pendingSettlements: number
}

export type CreateTransactionDto = Omit<Transaction, 'id' | 'createdAt'>
