import { describe, expect, it } from 'vitest'
import { TRANSMUTATION_ARRAY_IDS, TRANSMUTATION_ARRAYS, getTransmutationArrayLevelCost } from '../../content/transmutation/transmutationArrays'
import { createInitialState } from '../../../store/initialState'
import { getTransmutationArrayBonuses, getEffectiveTransmutationManaCost, getEffectiveTransmutationDuration } from './transmutationArrays'
import { TRANSMUTATION_RECIPES } from '../../content/recipes/recipes'

describe('Transmutation Arrays', () => {
  it('starts five Rank I arrays and reaches the locked Lv10 bonuses', () => {
    const state = createInitialState()
    expect(TRANSMUTATION_ARRAY_IDS).toHaveLength(5)
    expect(Object.values(state.progress.transmutation.arrays).every((array) => array.rank === 1 && array.level === 0)).toBe(true)
    TRANSMUTATION_ARRAY_IDS.forEach((id) => { state.progress.transmutation.arrays[id].level = 10 })
    expect(getTransmutationArrayBonuses(state)).toEqual({ craftSpeedPct: 0.3, craftSpeedMultiplier: 1.3, preservationChance: 0.05, replicationChance: 0.2, manaCostReductionPct: 0.2, echoCapacityBonus: 2 })
  })

  it('uses weighted Channeling-equivalent costs', () => {
    expect(getTransmutationArrayLevelCost('temporal-array', 1)).toEqual({ fragments: { fire: 20, water: 12, earth: 16, air: 32 }, lifeEssence: 50 })
    expect(getTransmutationArrayLevelCost('echo-stabilization-array', 10)).toEqual({ fragments: { fire: 800, water: 1200, earth: 600, air: 1400 }, lifeEssence: 2500 })
    const totals = TRANSMUTATION_ARRAY_IDS.reduce((total, id) => {
      for (let level = 1; level <= 10; level += 1) {
        const cost = getTransmutationArrayLevelCost(id, level)!
        total.elemental += Object.values(cost.fragments).reduce((sum, value) => sum + value, 0)
        total.life += cost.lifeEssence
      }
      return total
    }, { elemental: 0, life: 0 })
    expect(totals).toEqual({ elemental: 64_400, life: 40_250 })
    expect(Object.values(TRANSMUTATION_ARRAYS).every((array) => Object.values(array.fragmentWeights).reduce((sum, weight) => sum + weight, 0) === 4)).toBe(true)
  })

  it('shares effective recipe speed and Mana calculations', () => {
    const state = createInitialState()
    state.progress.transmutation.arrays['temporal-array'].level = 10
    state.progress.transmutation.arrays['mana-refinement-array'].level = 10
    const recipe = TRANSMUTATION_RECIPES['prismatic-fragment']
    expect(getEffectiveTransmutationDuration(state, recipe, 1)).toBeCloseTo(18_461.538, 2)
    expect(getEffectiveTransmutationManaCost(state, recipe)).toBe(40)
  })
})
