export interface Sigil {
  description: string
  shape: string
  primary: string
}

export interface House {
  id: string
  name: string
  epithet: string
  motto: string
  region: string
  seat: string
  bloc: string
  values: string
  territory: string
  doctrine: string
  shadow: string
  sigil: Sigil
  headId: string | null
  vassalOf: string | null
  tier?: 'coroa' | 'soberana' | 'maior' | 'menor' | 'estrangeira'
}

export interface Region {
  id: string
  name: string
  settlement: string
  macroRegion: string
  houseId: string | null
  terrain: string
  climate: string
  x: number
  y: number
  kmNorth: number
  description: string
  strategicNote: string
}

export interface Route {
  id: string
  fromId: string
  toId: string
  distanceKm: number
  mode: 'estrada' | 'trilha' | 'rio' | 'mar'
  hazard?: number
  note: string
}
