export type PartnerType = 'CLINICA' | 'HOSPITAL' | 'VETERINARIO' | 'OUTRO'
export type CommissionType = 'PERCENTUAL' | 'FIXO' | 'NENHUM'

export interface Partner {
  id: string
  name: string
  type: PartnerType
  cnpj?: string
  cpf?: string
  phone: string
  email?: string
  address?: string
  commissionType: CommissionType
  commissionValue: number
  notes?: string
  createdAt: string
}

export type CreatePartnerDto = Omit<Partner, 'id' | 'createdAt'>
