export interface CatalogEffect {
  id: number
  name: string
  slot: string
  params: CatalogParam[]
}

export interface CatalogParam {
  name: string
  min: number
  max: number
  default: number
  unit?: string
}

export interface Catalog {
  effects: CatalogEffect[]
}
