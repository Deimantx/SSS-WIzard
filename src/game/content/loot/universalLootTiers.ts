import type { LootCategory, LootScalingRules } from './lootCategoryTypes'
import type { SigilQuality } from '../sigils/sigilQualities'

export const UNIVERSAL_LOOT_UNLOCK_REGISTRY = {
  'crystal-cache-t1': { label: 'Tier 1 Crystal Cache' },
} as const

export type UniversalLootUnlockId = keyof typeof UNIVERSAL_LOOT_UNLOCK_REGISTRY

export interface UniversalLootTierDefinition {
  tier: number
  minPower: number
  quantityMultiplier: number
  chanceMultiplier: number
  rarityMultiplier: number
  sigilDropChance: number
  crystalCacheDropChance: number
  unlocks: readonly UniversalLootUnlockId[]
}

export const UNIVERSAL_LOOT_TIERS = [
  { tier: 1, minPower: 0, quantityMultiplier: 1, chanceMultiplier: 1, rarityMultiplier: 1, sigilDropChance: .01, crystalCacheDropChance: 0, unlocks: [] },
  { tier: 2, minPower: 250, quantityMultiplier: 1.15, chanceMultiplier: 1.05, rarityMultiplier: 1.03, sigilDropChance: .012, crystalCacheDropChance: 0, unlocks: [] },
  { tier: 3, minPower: 500, quantityMultiplier: 1.3, chanceMultiplier: 1.1, rarityMultiplier: 1.06, sigilDropChance: .014, crystalCacheDropChance: 0, unlocks: [] },
  { tier: 4, minPower: 750, quantityMultiplier: 1.5, chanceMultiplier: 1.15, rarityMultiplier: 1.10, sigilDropChance: .016, crystalCacheDropChance: 0, unlocks: [] },
  { tier: 5, minPower: 1_000, quantityMultiplier: 1.75, chanceMultiplier: 1.2, rarityMultiplier: 1.14, sigilDropChance: .018, crystalCacheDropChance: 0, unlocks: [] },
  { tier: 6, minPower: 1_500, quantityMultiplier: 2, chanceMultiplier: 1.25, rarityMultiplier: 1.18, sigilDropChance: .02, crystalCacheDropChance: 0, unlocks: [] },
  { tier: 7, minPower: 2_000, quantityMultiplier: 2.3, chanceMultiplier: 1.3, rarityMultiplier: 1.22, sigilDropChance: .023, crystalCacheDropChance: 0, unlocks: [] },
  { tier: 8, minPower: 2_750, quantityMultiplier: 2.6, chanceMultiplier: 1.35, rarityMultiplier: 1.27, sigilDropChance: .026, crystalCacheDropChance: 0, unlocks: [] },
  { tier: 9, minPower: 3_500, quantityMultiplier: 3, chanceMultiplier: 1.4, rarityMultiplier: 1.32, sigilDropChance: .029, crystalCacheDropChance: 0, unlocks: [] },
  { tier: 10, minPower: 4_500, quantityMultiplier: 3.5, chanceMultiplier: 1.5, rarityMultiplier: 1.38, sigilDropChance: .032, crystalCacheDropChance: .001, unlocks: ['crystal-cache-t1'] },
  { tier: 11, minPower: 5_500, quantityMultiplier: 4, chanceMultiplier: 1.6, rarityMultiplier: 1.44, sigilDropChance: .035, crystalCacheDropChance: .0012, unlocks: [] },
  { tier: 12, minPower: 7_000, quantityMultiplier: 4.6, chanceMultiplier: 1.7, rarityMultiplier: 1.50, sigilDropChance: .038, crystalCacheDropChance: .0014, unlocks: [] },
  { tier: 13, minPower: 8_500, quantityMultiplier: 5.2, chanceMultiplier: 1.8, rarityMultiplier: 1.57, sigilDropChance: .042, crystalCacheDropChance: .0016, unlocks: [] },
  { tier: 14, minPower: 10_000, quantityMultiplier: 6, chanceMultiplier: 1.9, rarityMultiplier: 1.64, sigilDropChance: .046, crystalCacheDropChance: .0018, unlocks: [] },
  { tier: 15, minPower: 12_500, quantityMultiplier: 7, chanceMultiplier: 2, rarityMultiplier: 1.72, sigilDropChance: .05, crystalCacheDropChance: .002, unlocks: [] },
  { tier: 16, minPower: 15_000, quantityMultiplier: 8, chanceMultiplier: 2.15, rarityMultiplier: 1.80, sigilDropChance: .055, crystalCacheDropChance: .0023, unlocks: [] },
  { tier: 17, minPower: 18_000, quantityMultiplier: 9.2, chanceMultiplier: 2.3, rarityMultiplier: 1.88, sigilDropChance: .06, crystalCacheDropChance: .0026, unlocks: [] },
  { tier: 18, minPower: 22_000, quantityMultiplier: 10.5, chanceMultiplier: 2.5, rarityMultiplier: 1.96, sigilDropChance: .065, crystalCacheDropChance: .0029, unlocks: [] },
  { tier: 19, minPower: 27_500, quantityMultiplier: 12, chanceMultiplier: 2.75, rarityMultiplier: 2.05, sigilDropChance: .07, crystalCacheDropChance: .0032, unlocks: [] },
  { tier: 20, minPower: 35_000, quantityMultiplier: 14, chanceMultiplier: 3, rarityMultiplier: 2.15, sigilDropChance: .08, crystalCacheDropChance: .0035, unlocks: [] },
] as const satisfies readonly UniversalLootTierDefinition[]

export const UNIVERSAL_LOOT_BOSS_MULTIPLIERS = { quantity: 5, chance: 5, rarity: 5 } as const
export const UNIVERSAL_LOOT_CURRENCY_BASE_TARGETS = { 'life-essence': 3, 'artifact-essence': 1 } as const
export const UNIVERSAL_LOOT_CURRENCY_VARIANCE = { min: .8, max: 1.2 } as const
export const UNIVERSAL_LOOT_CATEGORIES: readonly LootCategory[] = ['currency', 'material', 'equipment', 'sigil', 'crystal', 'unique', 'progression']

export const LOOT_CATEGORY_RULES = {
  currency: { tierQuantity: true, tierChance: false, tierRarity: false, bossQuantity: true, bossChance: false, bossRarity: false },
  material: { tierQuantity: true, tierChance: true, tierRarity: false, bossQuantity: true, bossChance: true, bossRarity: false },
  equipment: { tierQuantity: false, tierChance: true, tierRarity: true, bossQuantity: false, bossChance: true, bossRarity: true },
  sigil: { tierQuantity: false, tierChance: true, tierRarity: true, bossQuantity: true, bossChance: true, bossRarity: true },
  crystal: { tierQuantity: false, tierChance: true, tierRarity: false, bossQuantity: true, bossChance: true, bossRarity: false },
  unique: { tierQuantity: false, tierChance: false, tierRarity: false, bossQuantity: false, bossChance: false, bossRarity: false },
  progression: { tierQuantity: true, tierChance: false, tierRarity: false, bossQuantity: true, bossChance: false, bossRarity: false },
} as const satisfies Record<LootCategory, Required<LootScalingRules>>

/** Sigil drop odds are separate from crafting quality odds and are shared by normal and boss drops. */
export const SIGIL_DROP_QUALITY_BASE: Record<number, Record<SigilQuality, number>> = {
  1: { common: 75, refined: 22, perfect: 2.8, legendary: .2 },
  2: { common: 55, refined: 32, perfect: 11, legendary: 2 },
}

export const getLootUnlockTier = (unlockId: UniversalLootUnlockId, tiers: readonly UniversalLootTierDefinition[] = UNIVERSAL_LOOT_TIERS): number | null => {
  const row = tiers.find((tier) => tier.unlocks.includes(unlockId))
  return row?.tier ?? null
}

export const isLootUnlockedAtTier = (unlockId: UniversalLootUnlockId, lootTier: number | UniversalLootTierDefinition): boolean => {
  const tierNumber = typeof lootTier === 'number' ? lootTier : lootTier.tier
  const unlockedAt = getLootUnlockTier(unlockId)
  return unlockedAt !== null && tierNumber >= unlockedAt
}

export const validateLootCategoryRules = (rules: Partial<Record<LootCategory, LootScalingRules>> = LOOT_CATEGORY_RULES) => {
  const errors: string[] = []
  for (const category of UNIVERSAL_LOOT_CATEGORIES) {
    const rule = rules[category]
    if (!rule) { errors.push(`Missing loot category rules for ${category}`); continue }
    for (const key of ['tierQuantity', 'tierChance', 'tierRarity', 'bossQuantity', 'bossChance', 'bossRarity'] as const) {
      if (typeof rule[key] !== 'boolean') errors.push(`Loot category ${category} must define ${key}`)
    }
  }
  return errors
}

export const validateUniversalLootTierDefinitions = (tiers: readonly UniversalLootTierDefinition[] = UNIVERSAL_LOOT_TIERS) => {
  const errors: string[] = [...validateLootCategoryRules()]
  const warnings: string[] = []
  if (tiers.length === 0 || tiers[0]?.minPower !== 0) errors.push('Loot Tier 1 must begin at Power 0')
  const unlockRows = new Map<string, number>()
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
    const rowIds = new Set<string>()
    tier.unlocks.forEach((unlockId) => {
      if (!(unlockId in UNIVERSAL_LOOT_UNLOCK_REGISTRY)) errors.push(`Tier ${tier.tier} has unknown loot unlock ${unlockId}`)
      if (rowIds.has(unlockId)) errors.push(`Tier ${tier.tier} has duplicate loot unlock ${unlockId}`)
      rowIds.add(unlockId)
      const previousTier = unlockRows.get(unlockId)
      if (previousTier !== undefined) errors.push(`Loot unlock ${unlockId} is authored more than once (T${previousTier}, T${tier.tier})`)
      else unlockRows.set(unlockId, tier.tier)
    })
  })
  return { errors, warnings }
}
