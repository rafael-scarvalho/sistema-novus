export type Species = 'CANINO' | 'FELINO' | 'EXOTICO' | 'OUTRO'
export type Sex = 'MACHO' | 'FEMEA'

export interface Guardian {
  id: string
  name: string
  cpf?: string
  phone: string
  whatsapp?: string
  email?: string
  address?: string
  portalAccessToken?: string
  createdAt: string
}

export interface Patient {
  id: string
  name: string
  species: Species
  breed?: string
  sex: Sex
  birthDate?: string
  weight?: number
  microchip?: string
  guardianId: string
  guardian?: Guardian
  createdAt: string
}

export type CreatePatientDto = Omit<Patient, 'id' | 'createdAt' | 'guardian'>
export type CreateGuardianDto = Omit<Guardian, 'id' | 'createdAt' | 'portalAccessToken'>
