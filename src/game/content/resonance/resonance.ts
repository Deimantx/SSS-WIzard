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

export const sanitizeResonanceAmount = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)))
}

export const normalizeResonanceState = (value: unknown): ResonanceState => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  return Object.fromEntries(RESONANCE_TYPES.map((type) => [type, sanitizeResonanceAmount(source[type])])) as ResonanceState
}

export const multiplyResonanceBundle = (bundle: ResonanceYield, multiplier: unknown): ResonanceYield => {
  const safeMultiplier = typeof multiplier === 'number' && Number.isFinite(multiplier) ? Math.max(0, multiplier) : 0
  return Object.fromEntries(RESONANCE_TYPES.flatMap((type) => {
    const amount = sanitizeResonanceAmount(bundle[type])
    if (amount <= 0 || safeMultiplier <= 0) return []
    const product = amount > Number.MAX_SAFE_INTEGER / safeMultiplier ? Number.MAX_SAFE_INTEGER : amount * safeMultiplier
    return [[type, sanitizeResonanceAmount(product)]]
  })) as ResonanceYield
}
