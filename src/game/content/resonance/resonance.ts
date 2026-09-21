/** Phase 1 Resonance follows the four playable Magic Schools only. */
export const RESONANCE_TYPES = ['fire', 'water', 'earth', 'air'] as const

export type ResonanceType = typeof RESONANCE_TYPES[number]
export type ResonanceState = Record<ResonanceType, number>
export type ResonanceYield = Partial<Record<ResonanceType, number>>

export const RESONANCE_METADATA: Record<ResonanceType, { label: string; shortLabel: string }> = {
  fire: { label: 'Fire Resonance', shortLabel: 'Fire' },
  water: { label: 'Water Resonance', shortLabel: 'Water' },
  earth: { label: 'Earth Resonance', shortLabel: 'Earth' },
  air: { label: 'Air Resonance', shortLabel: 'Air' },
}

export const DEBUG_RESONANCE_TEST_BUNDLE: ResonanceState = { fire: 100, water: 100, earth: 100, air: 100 }
