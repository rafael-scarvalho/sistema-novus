export type CatalogItemCategory =
  | 'PROCEDIMENTO_CIRURGICO'
  | 'ANESTESIA'
  | 'MATERIAL'
  | 'MEDICAMENTO'
  | 'EXAME'
  | 'CONSULTORIA'
  | 'OUTRO'

export interface CatalogItem {
  id: string
  name: string
  description?: string
  category: CatalogItemCategory
  unitPrice: number
  unit: string
  active: boolean
  createdAt: string
}

export type CreateCatalogItemDto = Omit<CatalogItem, 'id' | 'createdAt'>
