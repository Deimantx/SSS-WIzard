import { describe, expect, it } from 'vitest'
import { RECIPES } from '../../content/recipes/recipes'
import { createInitialState } from '../../../store/initialState'
import { upgradeFocusCapacityAction, setFocusImprovementLevelAction } from '../../../store/actions/focusActions'
import { getFocusCapacityBreakdown } from './focusCapacity'
import { getRecipeCurrentEffectiveDuration } from '../transmutation/transmutationSelectors'

describe('Focus Capacity', () => {
  it('breaks Max Focus into base, improvement, rewards, equipment, and debug sources', () => {
    const state = createInitialState()
    state.progress.focusImprovement.level = 3
    state.progress.permanentFocusBonuses = { forestHeart: 20 }
    state.equipment.amulet = 'windthread-charm'
    state.debug.bonusMaxFocusFlat = 10

    expect(getFocusCapacityBreakdown(state)).toEqual({ base: 100, improvement: 30, permanentRewards: 20, equipment: 10, debug: 10, total: 170 })
  })

  it('consumes the exact Level 1 cost and updates derived Max Focus', () => {
    const state = createInitialState()
    state.inventory['prismatic-fragment'] = 5
    state.inventory['life-essence'] = 10

    expect(upgradeFocusCapacityAction(state)).toBe(true)
    expect(state.progress.focusImprovement).toEqual({ rank: 1, level: 1 })
    expect(state.inventory['prismatic-fragment']).toBe(0)
    expect(state.inventory['life-essence']).toBe(0)
    expect(state.player.maxFocus).toBe(110)
  })

  it('blocks protected materials without changing progression or inventory', () => {
    const state = createInitialState()
    state.inventory['prismatic-fragment'] = 5
    state.inventory['life-essence'] = 10
    state.protectedItems['prismatic-fragment'] = true

    expect(upgradeFocusCapacityAction(state)).toBe(false)
    expect(state.progress.focusImprovement.level).toBe(0)
    expect(state.inventory['prismatic-fragment']).toBe(5)
    expect(state.inventory['life-essence']).toBe(10)
  })

  it('stops at Rank I mastery and grants the full bonus', () => {
    const state = createInitialState()
    setFocusImprovementLevelAction(state, 10)
    state.inventory['prismatic-fragment'] = 999
    state.inventory['life-essence'] = 999

    expect(state.player.maxFocus).toBe(200)
    expect(upgradeFocusCapacityAction(state)).toBe(false)
    expect(state.inventory['prismatic-fragment']).toBe(999)
  })

  it('defines the Prismatic Fragment recipe and normal Echo acceleration', () => {
    const recipe = RECIPES['prismatic-fragment']
    expect(recipe).toMatchObject({ baseDurationMs: 18_000, manaCost: 0, output: { itemId: 'prismatic-fragment', quantity: 1 } })
    expect(recipe.ingredients).toEqual([
      { itemId: 'fire-fragment', quantity: 2 },
      { itemId: 'water-fragment', quantity: 2 },
      { itemId: 'earth-fragment', quantity: 2 },
      { itemId: 'air-fragment', quantity: 2 },
      { itemId: 'life-essence', quantity: 10 },
    ])
    expect(getRecipeCurrentEffectiveDuration(recipe, 1)).toBe(18_000)
    expect(getRecipeCurrentEffectiveDuration(recipe, 3)).toBe(6_000)
  })
})
