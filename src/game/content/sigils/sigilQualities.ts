export type SigilQuality = 'common' | 'refined' | 'perfect' | 'legendary'

export interface SigilQualityDefinition {
  id: SigilQuality
  label: string
  maxRank: number
  startingSecondaries: number
  traitCount: number
}

export const SIGIL_QUALITIES: readonly SigilQualityDefinition[] = [
  { id: 'common', label: 'Common', maxRank: 10, startingSecondaries: 0, traitCount: 0 },
  { id: 'refined', label: 'Refined', maxRank: 12, startingSecondaries: 1, traitCount: 0 },
  { id: 'perfect', label: 'Perfect', maxRank: 15, startingSecondaries: 2, traitCount: 1 },
  { id: 'legendary', label: 'Legendary', maxRank: 20, startingSecondaries: 3, traitCount: 2 },
]

export const getSigilQualityDefinition = (quality: SigilQuality) =>
  SIGIL_QUALITIES.find((definition) => definition.id === quality) ?? SIGIL_QUALITIES[0]

export const isSigilQuality = (value: unknown): value is SigilQuality =>
  SIGIL_QUALITIES.some((definition) => definition.id === value)
