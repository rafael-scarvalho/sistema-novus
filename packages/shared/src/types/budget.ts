export type BudgetStatus = 'RASCUNHO' | 'ENVIADO' | 'APROVADO' | 'RECUSADO' | 'EXPIRADO'
export type PaymentMethod =
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'BOLETO'
  | 'TRANSFERENCIA'
  | 'PARCELADO'

export interface BudgetItem {
  id: string
  budgetId: string
  catalogItemId?: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

export interface BudgetPaymentOption {
  method: PaymentMethod
  installments?: number
  discount?: number
  total: number
  notes?: string
}

export interface Budget {
  id: string
  code: string
  patientId: string
  partnerId?: string
  status: BudgetStatus
  validUntil?: string
  notes?: string
  items: BudgetItem[]
  paymentOptions: BudgetPaymentOption[]
  subtotal: number
  discount: number
  total: number
  approvedPaymentMethod?: PaymentMethod
  approvedAt?: string
  surgeryId?: string
  createdAt: string
  updatedAt: string
}

export type CreateBudgetDto = {
  patientId: string
  partnerId?: string
  validUntil?: string
  notes?: string
  items: Omit<BudgetItem, 'id' | 'budgetId' | 'total'>[]
  paymentOptions: BudgetPaymentOption[]
}
