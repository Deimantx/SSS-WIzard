export type LootCategory = 'currency' | 'material' | 'equipment' | 'sigil' | 'crystal' | 'unique' | 'progression'

/** Optional multipliers are category-specific and remain authored with each drop. */
export interface LootScalingRules {
  tierQuantity?: boolean
  tierChance?: boolean
  tierRarity?: boolean
  bossQuantity?: boolean
  bossChance?: boolean
  bossRarity?: boolean
}

export interface MonsterLootDropDefinition {
  itemId: import('../../types').ItemId
  category: LootCategory
  baseChance: number
  quantity: { min: number; max: number }
  minLootTier?: number
  scaling?: LootScalingRules
}
