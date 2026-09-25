import { isBossMonster, MONSTERS } from '../../content/monsters'
import { resolveEnemyPowerRating } from '../../presentation/combat/enemyPowerRating'
import type { MonsterId, WorldTierId } from '../../types'
import { getWorldTierDefinition, resolveWorldTierLootQuantity } from '../world-tier/worldTierRuntime'

export type PowerScaledCombatCurrencyId = 'life-essence' | 'artifact-essence'

export interface PowerScaledCombatCurrencyConfig {
  itemId: PowerScaledCombatCurrencyId
  powerDivisor: number
  minMultiplier: number
  maxMultiplier: number
  bossMultiplier: number
}

export const POWER_SCALED_COMBAT_CURRENCY_CONFIG: Record<PowerScaledCombatCurrencyId, PowerScaledCombatCurrencyConfig> = {
  'life-essence': { itemId: 'life-essence', powerDivisor: 60, minMultiplier: 0.80, maxMultiplier: 1.20, bossMultiplier: 1.25 },
  'artifact-essence': { itemId: 'artifact-essence', powerDivisor: 330, minMultiplier: 0.80, maxMultiplier: 1.20, bossMultiplier: 2.50 },
}

export interface PowerScaledCurrencyBaseRange {
  itemId: PowerScaledCombatCurrencyId
  enemyId: MonsterId
  wt1Power: number
  powerDivisor: number
  bossMultiplier: number
  baseTarget: number
  baseMin: number
  baseMax: number
}

export interface PowerScaledCurrencyRewardRange extends PowerScaledCurrencyBaseRange {
  worldTier: WorldTierId
  worldTierLootMultiplier: number
  finalMin: number
  finalMax: number
}

const getCurrencyConfig = (itemId: PowerScaledCombatCurrencyId) => POWER_SCALED_COMBAT_CURRENCY_CONFIG[itemId]

export const resolveBasePowerScaledCurrencyRange = (enemyId: MonsterId, itemId: PowerScaledCombatCurrencyId): PowerScaledCurrencyBaseRange => {
  const config = getCurrencyConfig(itemId)
  const wt1Power = Math.max(1, resolveEnemyPowerRating(enemyId, 1))
  const bossMultiplier = isBossMonster(MONSTERS[enemyId]) ? config.bossMultiplier : 1
  const baseTarget = wt1Power / config.powerDivisor * bossMultiplier
  const baseMin = Math.max(1, Math.floor(baseTarget * config.minMultiplier))
  const baseMax = Math.max(baseMin, Math.ceil(baseTarget * config.maxMultiplier))
  return { itemId, enemyId, wt1Power, powerDivisor: config.powerDivisor, bossMultiplier, baseTarget, baseMin, baseMax }
}

export const resolvePowerScaledCurrencyRewardRange = (enemyId: MonsterId, itemId: PowerScaledCombatCurrencyId, worldTier: WorldTierId = 1): PowerScaledCurrencyRewardRange => {
  const base = resolveBasePowerScaledCurrencyRange(enemyId, itemId)
  const tier = getWorldTierDefinition(worldTier)
  return {
    ...base,
    worldTier: tier.id,
    worldTierLootMultiplier: tier.itemLootQuantityMultiplier,
    finalMin: resolveWorldTierLootQuantity(base.baseMin, tier.id),
    finalMax: resolveWorldTierLootQuantity(base.baseMax, tier.id),
  }
}

export const rollPowerScaledCurrencyReward = (enemyId: MonsterId, itemId: PowerScaledCombatCurrencyId, worldTier: WorldTierId, rng: () => number = Math.random): number => {
  const range = resolvePowerScaledCurrencyRewardRange(enemyId, itemId, worldTier)
  const rawRoll = rng()
  const normalizedRoll = Number.isFinite(rawRoll) ? Math.min(1 - Number.EPSILON, Math.max(0, rawRoll)) : 0
  const baseQuantity = Math.floor(range.baseMin + normalizedRoll * (range.baseMax - range.baseMin + 1))
  return resolveWorldTierLootQuantity(baseQuantity, range.worldTier)
}

export const resolveEnemyEssenceRewardRanges = (enemyId: MonsterId, worldTier: WorldTierId = 1) => ({
  'life-essence': resolvePowerScaledCurrencyRewardRange(enemyId, 'life-essence', worldTier),
  'artifact-essence': resolvePowerScaledCurrencyRewardRange(enemyId, 'artifact-essence', worldTier),
})
