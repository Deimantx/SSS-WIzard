export const WORLD_TIER_IDS = [1, 2, 3, 4, 5] as const

export type WorldTierId = typeof WORLD_TIER_IDS[number]

export interface WorldTierState {
  current: WorldTierId
  highestUnlocked: WorldTierId
}

export interface WorldTierDefinition {
  id: WorldTierId
  name: string
  enemyHealthMultiplier: number
  enemyDamageMultiplier: number
  enemyDefenseMultiplier: number
  resonanceRewardMultiplier: number
  itemLootQuantityMultiplier: number
  bossThreatRequirementMultiplier: number
}

/** Prototype Phase 4B values. These are intentionally fixed authored data, not final balance. */
export const WORLD_TIERS: Record<WorldTierId, WorldTierDefinition> = {
  1: { id: 1, name: 'World Tier 1', enemyHealthMultiplier: 1, enemyDamageMultiplier: 1, enemyDefenseMultiplier: 1, resonanceRewardMultiplier: 1, itemLootQuantityMultiplier: 1, bossThreatRequirementMultiplier: 1 },
  2: { id: 2, name: 'World Tier 2', enemyHealthMultiplier: 2, enemyDamageMultiplier: 1.4, enemyDefenseMultiplier: 1.25, resonanceRewardMultiplier: 2, itemLootQuantityMultiplier: 2, bossThreatRequirementMultiplier: 2 },
  3: { id: 3, name: 'World Tier 3', enemyHealthMultiplier: 3, enemyDamageMultiplier: 1.8, enemyDefenseMultiplier: 1.5, resonanceRewardMultiplier: 3, itemLootQuantityMultiplier: 3, bossThreatRequirementMultiplier: 3 },
  4: { id: 4, name: 'World Tier 4', enemyHealthMultiplier: 4, enemyDamageMultiplier: 2.2, enemyDefenseMultiplier: 1.75, resonanceRewardMultiplier: 4, itemLootQuantityMultiplier: 4, bossThreatRequirementMultiplier: 4 },
  5: { id: 5, name: 'World Tier 5', enemyHealthMultiplier: 5, enemyDamageMultiplier: 2.6, enemyDefenseMultiplier: 2, resonanceRewardMultiplier: 5, itemLootQuantityMultiplier: 5, bossThreatRequirementMultiplier: 5 },
}

export const DEFAULT_WORLD_TIER_STATE: WorldTierState = { current: 1, highestUnlocked: 1 }

/** Canonical boss evidence that unlocks the next World Tier. */
export const WORLD_TIER_UNLOCK_BOSS_BY_TIER = {
  2: 'archmage-edrin-shade',
  3: 'crossroads-keeper',
  4: 'meridian-splitter',
  5: 'black-gatekeeper',
} as const
