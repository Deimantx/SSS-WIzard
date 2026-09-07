import type { EquipmentBuildTag, EquipmentBudgetProfileId } from '../../types'

export interface EquipmentBudgetProfile {
  coreShare: number
  substatShare: number
  signatureShare: number
  totalMultiplier: number
}

export const EQUIPMENT_BUDGET_PROFILES = {
  standard: { coreShare: 0.70, substatShare: 0.30, signatureShare: 0, totalMultiplier: 1 },
  signature: { coreShare: 0.60, substatShare: 0.25, signatureShare: 0.15, totalMultiplier: 1 },
  boss: { coreShare: 0.60, substatShare: 0.20, signatureShare: 0.20, totalMultiplier: 1.10 },
} as const satisfies Record<EquipmentBudgetProfileId, EquipmentBudgetProfile>

export const EQUIPMENT_BUILD_TAG_LABELS = {
  spell: 'Spell',
  'basic-attack': 'Basic Attack',
  hybrid: 'Hybrid',
  crit: 'Crit',
  status: 'Status',
  dot: 'DoT',
  barrier: 'Barrier',
  defense: 'Defense',
  sustain: 'Sustain',
  mana: 'Mana',
  focus: 'Focus',
  healing: 'Healing',
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
  air: 'Air',
} satisfies Record<EquipmentBuildTag, string>

export const formatEquipmentTier = (tier: number) => Number.isInteger(tier) ? tier.toFixed(1) : String(tier)

export const getPlayerEquipmentTier = (internalTier: number): number => Math.floor(internalTier)
export const formatPlayerEquipmentTier = (internalTier: number): string => `T${getPlayerEquipmentTier(internalTier)}`

/** Collect development errors without throwing during authored-definition validation. */
export function validateEquipmentBudgetProfiles(errors: string[] = []) {
  Object.entries(EQUIPMENT_BUDGET_PROFILES).forEach(([id, profile]) => {
    const shareTotal = profile.coreShare + profile.substatShare + profile.signatureShare
    if (Math.abs(shareTotal - 1) > 0.000001) errors.push(`equipment budget profile ${id}: shares must sum to 1`)
    if (!Number.isFinite(profile.totalMultiplier) || profile.totalMultiplier <= 0) errors.push(`equipment budget profile ${id}: totalMultiplier must be greater than 0`)
  })
  return errors
}
