import { describe, expect, it } from 'vitest'
import { UNIVERSAL_LOOT_CURRENCY_BASE_TARGETS, UNIVERSAL_LOOT_CURRENCY_VARIANCE } from '../../content/loot/universalLootTiers'
import { resolveCombatCurrencyRewardRange } from './combatCurrencyRewards'
import { resolveCombatLootContext, roundLootQuantity } from './universalLootRuntime'

describe('Combat currency rewards', () => {
  it('uses authored base targets and Power-selected quantity scaling', () => {
    for (const itemId of ['life-essence', 'artifact-essence'] as const) {
      const context = resolveCombatLootContext('forest-wisp')
      const result = resolveCombatCurrencyRewardRange('forest-wisp', itemId)
      const scale = context.lootTier.quantityMultiplier
      expect(result.baseTarget).toBe(UNIVERSAL_LOOT_CURRENCY_BASE_TARGETS[itemId])
      expect(result.finalMin).toBe(roundLootQuantity(result.baseTarget * UNIVERSAL_LOOT_CURRENCY_VARIANCE.min * scale))
      expect(result.finalMax).toBe(roundLootQuantity(result.baseTarget * UNIVERSAL_LOOT_CURRENCY_VARIANCE.max * scale))
      expect(result.effectivePower).toBe(context.effectivePower)
      expect(result.lootTier).toBe(context.lootTier.tier)
    }
  })

  it('applies boss quantity as a separate fivefold profile', () => {
    const normal = resolveCombatCurrencyRewardRange('crossroads-keeper', 'life-essence')
    const context = resolveCombatLootContext('crossroads-keeper')
    expect(context.isBoss).toBe(true)
    expect(normal.bossQuantityMultiplier).toBe(5)
    expect(normal.finalMin).toBe(roundLootQuantity(normal.baseTarget * UNIVERSAL_LOOT_CURRENCY_VARIANCE.min * context.lootTier.quantityMultiplier * 5))
  })
})
