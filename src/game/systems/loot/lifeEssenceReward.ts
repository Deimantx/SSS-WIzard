import { MONSTERS, isBossMonster } from '../../content/monsters'
import { resolveEnemyPowerRating } from '../../presentation/combat/enemyPowerRating'
import type { MonsterId, WorldTierId } from '../../types'
import { getWorldTierDefinition, resolveWorldTierLootQuantity } from '../world-tier/worldTierRuntime'

export const LIFE_ESSENCE_POWER_DIVISOR = 60
export const LIFE_ESSENCE_RANGE_MIN_MULTIPLIER = 0.80
export const LIFE_ESSENCE_RANGE_MAX_MULTIPLIER = 1.20
export const LIFE_ESSENCE_BOSS_MULTIPLIER = 1.25

/**
 * Life Essence is a universal guaranteed kill reward.
 * Base yield follows WT1 Enemy Power so stronger enemies naturally become
 * better sources without per-monster tuning. World Tier item-loot scaling is
 * applied afterward.
 */
export interface LifeEssenceBaseRange {
  enemyId: MonsterId
  powerAtWT1: number
  bossMultiplier: number
  baseTarget: number
  baseMin: number
  baseMax: number
}

export interface LifeEssenceRewardRange extends LifeEssenceBaseRange {
  worldTier: WorldTierId
  worldTierMultiplier: number
  finalMin: number
  finalMax: number
}

export const resolveBaseLifeEssenceRange = (enemyId: MonsterId): LifeEssenceBaseRange => {
  const monster = MONSTERS[enemyId]
  const powerAtWT1 = Math.max(1, resolveEnemyPowerRating(enemyId, 1))
  const bossMultiplier = monster && isBossMonster(monster) ? LIFE_ESSENCE_BOSS_MULTIPLIER : 1
  const baseTarget = powerAtWT1 / LIFE_ESSENCE_POWER_DIVISOR * bossMultiplier
  const baseMin = Math.max(1, Math.floor(baseTarget * LIFE_ESSENCE_RANGE_MIN_MULTIPLIER))
  const baseMax = Math.max(baseMin, Math.ceil(baseTarget * LIFE_ESSENCE_RANGE_MAX_MULTIPLIER))
  return { enemyId, powerAtWT1, bossMultiplier, baseTarget, baseMin, baseMax }
}

export const resolveLifeEssenceRewardRange = (enemyId: MonsterId, worldTier: WorldTierId = 1): LifeEssenceRewardRange => {
  const base = resolveBaseLifeEssenceRange(enemyId)
  const tier = getWorldTierDefinition(worldTier)
  return {
    ...base,
    worldTier: tier.id,
    worldTierMultiplier: tier.itemLootQuantityMultiplier,
    finalMin: resolveWorldTierLootQuantity(base.baseMin, tier.id),
    finalMax: resolveWorldTierLootQuantity(base.baseMax, tier.id),
  }
}

export const rollLifeEssenceReward = (enemyId: MonsterId, worldTier: WorldTierId, rng: () => number = Math.random) => {
  const range = resolveLifeEssenceRewardRange(enemyId, worldTier)
  const rawRoll = rng()
  const normalizedRoll = typeof rawRoll === 'number' && Number.isFinite(rawRoll) ? Math.min(1 - Number.EPSILON, Math.max(0, rawRoll)) : 0
  const baseQuantity = Math.floor(range.baseMin + normalizedRoll * (range.baseMax - range.baseMin + 1))
  return resolveWorldTierLootQuantity(baseQuantity, range.worldTier)
}
