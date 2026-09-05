import { describe, expect, it } from 'vitest'
import { RECIPES } from '../../content/recipes/recipes'
import { createInitialState } from '../../../store/initialState'
import { getRecipeMaterialCapacity, getTransmutationRecipeFilterCounts, getVisibleTransmutationRecipes, type TransmutationRecipeFilters } from './transmutationSelectors'

const allFilters: TransmutationRecipeFilters = { categoryFilter: 'all', tierFilter: 'all', craftableOnly: false, activeOnly: false }

describe('Transmutation recipe filter read model', () => {
  it('never exposes Equipment even in developer view', () => {
    expect(getVisibleTransmutationRecipes(createInitialState(), allFilters, '', true)).toHaveLength(5)
  })



  it('matches Elemental tiers from authored metadata and returns clean empty future tiers', () => {
    const state = createInitialState()
    expect(getVisibleTransmutationRecipes(state, { ...allFilters, categoryFilter: 'elemental', tierFilter: 1 }).map((recipe) => recipe.id)).toEqual(['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'])
    expect(getVisibleTransmutationRecipes(state, { ...allFilters, categoryFilter: 'elemental', tierFilter: 2 })).toEqual([])
    expect(getTransmutationRecipeFilterCounts(state, { ...allFilters, categoryFilter: 'elemental' }).tierCounts.elemental[1]).toBe(4)
  })

  it('calculates finite material capacity, bottleneck, and missing quantities without Mana', () => {
    const requirements = [
      { itemId: 'fire-fragment' as const, required: 4, owned: 22, equipped: 0, available: 22, protected: false },
      { itemId: 'wisp-essence' as const, required: 2, owned: 11, equipped: 0, available: 11, protected: false },
    ]
    expect(getRecipeMaterialCapacity(requirements)).toMatchObject({ cycles: 5, limitingItemId: 'fire-fragment', missing: [] })
    expect(getRecipeMaterialCapacity([{ ...requirements[0], available: 1 }, { ...requirements[1], available: 0 }])).toMatchObject({ cycles: 0, missing: [{ itemId: 'fire-fragment', quantity: 3 }, { itemId: 'wisp-essence', quantity: 2 }] })
    expect(getRecipeMaterialCapacity([])).toEqual({ cycles: null, limitingItemId: null, missing: [] })
  })

})
