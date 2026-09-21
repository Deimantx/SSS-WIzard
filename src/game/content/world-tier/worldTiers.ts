export const WORLD_TIER_IDS = [1, 2] as const

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
}

/** Prototype Phase 2 values. These are intentionally fixed authored data. */
export const WORLD_TIERS: Record<WorldTierId, WorldTierDefinition> = {
  1: { id: 1, name: 'World Tier 1', enemyHealthMultiplier: 1, enemyDamageMultiplier: 1, enemyDefenseMultiplier: 1, resonanceRewardMultiplier: 1 },
  2: { id: 2, name: 'World Tier 2', enemyHealthMultiplier: 2, enemyDamageMultiplier: 1.4, enemyDefenseMultiplier: 1.25, resonanceRewardMultiplier: 2 },
}

export const DEFAULT_WORLD_TIER_STATE: WorldTierState = { current: 1, highestUnlocked: 1 }
