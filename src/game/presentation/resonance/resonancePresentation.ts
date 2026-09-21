import { RESONANCE_METADATA, RESONANCE_TYPES, type ResonanceState, type ResonanceType, type ResonanceYield } from '../../content/resonance/resonance'
import { sanitizeResonanceAmount } from '../../systems/resonance/resonanceRuntime'

export interface ResonanceEntry { type: ResonanceType; label: string; amount: number }

export const getResonanceLabel = (type: ResonanceType) => RESONANCE_METADATA[type].label
export const formatResonanceAmount = (amount: unknown) => sanitizeResonanceAmount(amount).toLocaleString('en-US')

export const getNonZeroResonanceEntries = (bundle: ResonanceYield | ResonanceState): ResonanceEntry[] => RESONANCE_TYPES.flatMap((type) => {
  const amount = sanitizeResonanceAmount(bundle[type])
  return amount > 0 ? [{ type, label: RESONANCE_METADATA[type].shortLabel, amount }] : []
})

export const formatResonanceBundle = (bundle: ResonanceYield | ResonanceState, includeZero = false) => {
  const entries = includeZero ? RESONANCE_TYPES.map((type) => ({ type, label: RESONANCE_METADATA[type].shortLabel, amount: sanitizeResonanceAmount(bundle[type]) })) : getNonZeroResonanceEntries(bundle)
  return entries.length ? entries.map(({ label, amount }) => `+${formatResonanceAmount(amount)} ${label} Resonance`).join(' · ') : '0 Resonance'
}
