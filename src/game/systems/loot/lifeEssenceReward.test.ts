import { describe, expect, it } from 'vitest'
import { MONSTERS, isBossMonster } from '../../content/monsters'
import { resolveEnemyPowerRating } from '../../presentation/combat/enemyPowerRating'
import { resolveWorldTierLootQuantity } from '../world-tier/worldTierRuntime'
import { LIFE_ESSENCE_BOSS_MULTIPLIER, LIFE_ESSENCE_POWER_DIVISOR, LIFE_ESSENCE_RANGE_MAX_MULTIPLIER, LIFE_ESSENCE_RANGE_MIN_MULTIPLIER, resolveBaseLifeEssenceRange, resolveLifeEssenceRewardRange, rollLifeEssenceReward } from './lifeEssenceReward'

describe('Life Essence reward resolver', () => {
  it('derives the normal WT1 range from Enemy Power', () => {
    const reward = resolveBaseLifeEssenceRange('forest-wisp')
    const target = resolveEnemyPowerRating('forest-wisp', 1) / LIFE_ESSENCE_POWER_DIVISOR
    expect(reward.powerAtWT1).toBe(resolveEnemyPowerRating('forest-wisp', 1))
    expect(reward.baseTarget).toBe(target)
    expect(reward.baseMin).toBe(Math.max(1, Math.floor(target * LIFE_ESSENCE_RANGE_MIN_MULTIPLIER)))
    expect(reward.baseMax).toBe(Math.max(reward.baseMin, Math.ceil(target * LIFE_ESSENCE_RANGE_MAX_MULTIPLIER)))
    expect(reward.bossMultiplier).toBe(1)
  })

  it('applies the boss target multiplier before the ±20% range', () => {
    const reward = resolveBaseLifeEssenceRange('forest-heart')
    const target = resolveEnemyPowerRating('forest-heart', 1) / LIFE_ESSENCE_POWER_DIVISOR * LIFE_ESSENCE_BOSS_MULTIPLIER
    expect(isBossMonster(MONSTERS['forest-heart'])).toBe(true)
    expect(reward.bossMultiplier).toBe(LIFE_ESSENCE_BOSS_MULTIPLIER)
    expect(reward.baseTarget).toBe(target)
    expect(reward.baseMin).toBe(Math.max(1, Math.floor(target * 0.8)))
    expect(reward.baseMax).toBe(Math.max(reward.baseMin, Math.ceil(target * 1.2)))
  })

  it('keeps the base roll WT-independent and applies canonical quantity scaling afterward', () => {
    const base = resolveLifeEssenceRewardRange('forest-wisp', 1)
    const wt5 = resolveLifeEssenceRewardRange('forest-wisp', 5)
    expect(wt5.baseMin).toBe(base.baseMin)
    expect(wt5.baseMax).toBe(base.baseMax)
    expect(wt5.finalMin).toBe(resolveWorldTierLootQuantity(base.baseMin, 5))
    expect(wt5.finalMax).toBe(resolveWorldTierLootQuantity(base.baseMax, 5))
    expect(rollLifeEssenceReward('forest-wisp', 1, () => 0)).toBe(base.baseMin)
    expect(rollLifeEssenceReward('forest-wisp', 1, () => 0.999999)).toBe(base.baseMax)
    expect(rollLifeEssenceReward('forest-wisp', 1, () => 1)).toBe(base.baseMax)
  })

  it('resolves a guaranteed positive reward even at the smallest power edge', () => {
    Object.values(MONSTERS).forEach((monster) => {
      const reward = resolveBaseLifeEssenceRange(monster.id)
      expect(reward.baseMin).toBeGreaterThanOrEqual(1)
      expect(reward.baseMax).toBeGreaterThanOrEqual(reward.baseMin)
    })
  })
})
