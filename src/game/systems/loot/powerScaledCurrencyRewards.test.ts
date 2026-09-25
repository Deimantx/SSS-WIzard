import { describe, expect, it } from 'vitest'
import { MONSTERS, isBossMonster } from '../../content/monsters'
import { resolveEnemyPowerRating } from '../../presentation/combat/enemyPowerRating'
import { resolveWorldTierLootQuantity } from '../world-tier/worldTierRuntime'
import { POWER_SCALED_COMBAT_CURRENCY_CONFIG, resolveBasePowerScaledCurrencyRange, resolvePowerScaledCurrencyRewardRange, rollPowerScaledCurrencyReward } from './powerScaledCurrencyRewards'

describe('power-scaled combat currency rewards', () => {
  it.each([
    ['life-essence', 'forest-wisp', 60],
    ['artifact-essence', 'forest-wisp', 330],
  ] as const)('derives the normal WT1 %s range from Enemy Power', (itemId, enemyId, divisor) => {
    const config = POWER_SCALED_COMBAT_CURRENCY_CONFIG[itemId]
    const reward = resolveBasePowerScaledCurrencyRange(enemyId, itemId)
    const target = resolveEnemyPowerRating(enemyId, 1) / divisor
    expect(reward.itemId).toBe(itemId)
    expect(reward.wt1Power).toBe(resolveEnemyPowerRating(enemyId, 1))
    expect(reward.baseTarget).toBe(target)
    expect(reward.baseMin).toBe(Math.max(1, Math.floor(target * config.minMultiplier)))
    expect(reward.baseMax).toBe(Math.max(reward.baseMin, Math.ceil(target * config.maxMultiplier)))
    expect(reward.bossMultiplier).toBe(1)
  })

  it.each([
    ['life-essence', 1.25],
    ['artifact-essence', 2.5],
  ] as const)('applies the %s boss multiplier before the ±20% range', (itemId, bossMultiplier) => {
    const reward = resolveBasePowerScaledCurrencyRange('forest-heart', itemId)
    const config = POWER_SCALED_COMBAT_CURRENCY_CONFIG[itemId]
    const target = resolveEnemyPowerRating('forest-heart', 1) / config.powerDivisor * bossMultiplier
    expect(isBossMonster(MONSTERS['forest-heart'])).toBe(true)
    expect(reward.bossMultiplier).toBe(bossMultiplier)
    expect(reward.baseTarget).toBe(target)
    expect(reward.baseMin).toBe(Math.max(1, Math.floor(target * config.minMultiplier)))
    expect(reward.baseMax).toBe(Math.max(reward.baseMin, Math.ceil(target * config.maxMultiplier)))
  })

  it.each(['life-essence', 'artifact-essence'] as const)('keeps %s base range WT-independent and scales only final quantity', (itemId) => {
    const base = resolvePowerScaledCurrencyRewardRange('forest-wisp', itemId, 1)
    const wt5 = resolvePowerScaledCurrencyRewardRange('forest-wisp', itemId, 5)
    expect(wt5.baseMin).toBe(base.baseMin)
    expect(wt5.baseMax).toBe(base.baseMax)
    expect(wt5.wt1Power).toBe(base.wt1Power)
    expect(wt5.finalMin).toBe(resolveWorldTierLootQuantity(base.baseMin, 5))
    expect(wt5.finalMax).toBe(resolveWorldTierLootQuantity(base.baseMax, 5))
    expect(rollPowerScaledCurrencyReward('forest-wisp', itemId, 1, () => 0)).toBe(base.baseMin)
    expect(rollPowerScaledCurrencyReward('forest-wisp', itemId, 1, () => 0.999999)).toBe(base.baseMax)
    expect(rollPowerScaledCurrencyReward('forest-wisp', itemId, 1, () => 1)).toBe(base.baseMax)
  })

  it('keeps both universal currency rewards positive for every authored enemy', () => {
    Object.values(MONSTERS).forEach((monster) => {
      ;(['life-essence', 'artifact-essence'] as const).forEach((itemId) => {
        const reward = resolveBasePowerScaledCurrencyRange(monster.id, itemId)
        expect(reward.wt1Power).toBeGreaterThan(0)
        expect(reward.baseMin).toBeGreaterThanOrEqual(1)
        expect(reward.baseMax).toBeGreaterThanOrEqual(reward.baseMin)
      })
    })
  })
})
