import type { LootCategory } from './lootCategoryTypes'
import type { SigilQuality } from '../sigils/sigilQualities'

export interface UniversalLootTierDefinition {
  tier: number
  minPower: number
  quantityMultiplier: number
  chanceMultiplier: number
  rarityMultiplier: number
  sigilDropChance: number
  crystalCacheDropChance: number
  unlocks: readonly string[]
}

const thresholds = [0, 250, 500, 750, 1000, 1500, 2000, 2750, 3500, 4500, 5500, 7000, 8500, 10000, 12500, 15000, 18000, 22000, 27500, 35000]
const quantities = [1, 1.15, 1.3, 1.5, 1.75, 2, 2.3, 2.6, 3, 3.5, 4, 4.6, 5.2, 6, 7, 8, 9.2, 10.5, 12, 14]
const chances = [1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2, 2.15, 2.3, 2.5, 2.75, 3]
const rarities = [1, 1.03, 1.06, 1.10, 1.14, 1.18, 1.22, 1.27, 1.32, 1.38, 1.44, 1.50, 1.57, 1.64, 1.72, 1.80, 1.88, 1.96, 2.05, 2.15]
const sigils = [.01, .012, .014, .016, .018, .02, .023, .026, .029, .032, .035, .038, .042, .046, .05, .055, .06, .065, .07, .08]
const crystals = [0, 0, 0, 0, 0, 0, 0, 0, 0, .001, .0012, .0014, .0016, .0018, .002, .0023, .0026, .0029, .0032, .0035]

export const UNIVERSAL_LOOT_TIERS: readonly UniversalLootTierDefinition[] = thresholds.map((minPower, index) => ({
  tier: index + 1, minPower, quantityMultiplier: quantities[index], chanceMultiplier: chances[index], rarityMultiplier: rarities[index],
  sigilDropChance: sigils[index], crystalCacheDropChance: crystals[index], unlocks: index === 9 ? ['Tier 1 Crystal Cache'] : [],
}))

export const UNIVERSAL_LOOT_BOSS_MULTIPLIERS = { quantity: 5, chance: 5, rarity: 5 } as const
export const UNIVERSAL_LOOT_CURRENCY_BASE_TARGETS = { 'life-essence': 3, 'artifact-essence': 1 } as const
export const UNIVERSAL_LOOT_CURRENCY_VARIANCE = { min: .8, max: 1.2 } as const
export const UNIVERSAL_LOOT_CRYSTAL_MIN_TIER = 10
export const UNIVERSAL_LOOT_CATEGORIES: readonly LootCategory[] = ['currency', 'material', 'equipment', 'sigil', 'crystal', 'unique', 'progression']

/** Drop quality odds are independent from crafting quality odds. */
export const UNIVERSAL_LOOT_SIGIL_QUALITY_WEIGHTS: Record<string, Record<SigilQuality, number>> = {
  '1-normal': { common: 75, refined: 22, perfect: 2.8, legendary: .2 },
  '1-boss': { common: 55, refined: 35, perfect: 9, legendary: 1 },
  '2-normal': { common: 55, refined: 32, perfect: 11, legendary: 2 },
  '2-boss': { common: 35, refined: 40, perfect: 22, legendary: 3 },
}

export const validateUniversalLootTierDefinitions = (tiers: readonly UniversalLootTierDefinition[] = UNIVERSAL_LOOT_TIERS) => {
  const errors: string[] = []
  const warnings: string[] = []
  if (tiers.length === 0 || tiers[0]?.minPower !== 0) errors.push('Loot Tier 1 must begin at Power 0')
  tiers.forEach((tier, index) => {
    if (tier.tier !== index + 1) errors.push(`Tier row ${index + 1} must declare tier ${index + 1}`)
    if (!Number.isFinite(tier.minPower) || tier.minPower < 0) errors.push(`Tier ${tier.tier} has invalid Power threshold`)
    if (index > 0 && tier.minPower <= tiers[index - 1].minPower) errors.push(`Tier ${tier.tier} Power threshold must increase`)
    for (const key of ['quantityMultiplier', 'chanceMultiplier', 'rarityMultiplier'] as const) {
      if (!Number.isFinite(tier[key]) || tier[key] <= 0) errors.push(`Tier ${tier.tier} has invalid ${key}`)
      if (index > 0 && tier[key] < tiers[index - 1][key]) warnings.push(`${key} decreases at Tier ${tier.tier}`)
    }
    if (!Number.isFinite(tier.sigilDropChance) || tier.sigilDropChance < 0 || tier.sigilDropChance > 1) errors.push(`Tier ${tier.tier} has invalid Sigil chance`)
    if (!Number.isFinite(tier.crystalCacheDropChance) || tier.crystalCacheDropChance < 0 || tier.crystalCacheDropChance > 1) errors.push(`Tier ${tier.tier} has invalid Crystal chance`)
  })
  return { errors, warnings }
}
