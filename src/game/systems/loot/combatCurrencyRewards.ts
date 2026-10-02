import { UNIVERSAL_LOOT_BOSS_MULTIPLIERS, UNIVERSAL_LOOT_CURRENCY_BASE_TARGETS, UNIVERSAL_LOOT_CURRENCY_VARIANCE } from '../../content/loot/universalLootTiers'
import type { MonsterId, WorldTierId } from '../../types'
import { resolveCombatLootContext, roundLootQuantity } from './universalLootRuntime'

export type CombatCurrencyItemId = keyof typeof UNIVERSAL_LOOT_CURRENCY_BASE_TARGETS

export interface CombatCurrencyRewardRange {
  itemId: CombatCurrencyItemId
  enemyId: MonsterId
  worldTier: WorldTierId
  effectivePower: number
  lootTier: number
  baseTarget: number
  tierQuantityMultiplier: number
  bossQuantityMultiplier: number
  finalMin: number
  finalMax: number
}

export const resolveCombatCurrencyRewardRange = (enemyId: MonsterId, itemId: CombatCurrencyItemId, worldTier: WorldTierId = 1): CombatCurrencyRewardRange => {
  const context = resolveCombatLootContext(enemyId, worldTier)
  const target = UNIVERSAL_LOOT_CURRENCY_BASE_TARGETS[itemId]
  const bossMultiplier = context.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity : 1
  const scale = context.lootTier.quantityMultiplier * bossMultiplier
  return {
    itemId, enemyId, worldTier, effectivePower: context.effectivePower, lootTier: context.lootTier.tier, baseTarget: target,
    tierQuantityMultiplier: context.lootTier.quantityMultiplier, bossQuantityMultiplier: bossMultiplier,
    finalMin: roundLootQuantity(target * UNIVERSAL_LOOT_CURRENCY_VARIANCE.min * scale),
    finalMax: roundLootQuantity(target * UNIVERSAL_LOOT_CURRENCY_VARIANCE.max * scale),
  }
}

export const resolveEnemyEssenceRewardRanges = (enemyId: MonsterId, worldTier: WorldTierId = 1) => ({
  'life-essence': resolveCombatCurrencyRewardRange(enemyId, 'life-essence', worldTier),
  'artifact-essence': resolveCombatCurrencyRewardRange(enemyId, 'artifact-essence', worldTier),
})
