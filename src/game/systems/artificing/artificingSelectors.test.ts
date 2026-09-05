import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { ARTIFICING_RECIPES } from '../../content/recipes/artificingRecipes'
import { canCraftArtificingRecipe, DEFAULT_ARTIFICING_FILTERS as defaults, getVisibleArtificingRecipes } from './artificingSelectors'

describe('Artificing catalog', () => {
  it('hides locked recipes, with an independent visibility-only debug override', () => {
    const state = createInitialState()
    expect(getVisibleArtificingRecipes(state)).toHaveLength(0)
    state.debug.showLockedTransmutationRecipes = true
    expect(getVisibleArtificingRecipes(state)).toHaveLength(0)
    state.debug.showLockedArtificingRecipes = true
    expect(getVisibleArtificingRecipes(state)).toHaveLength(27)
    expect(canCraftArtificingRecipe(state, 'ember-staff')).toBe(false)
    expect(getVisibleArtificingRecipes(state, { ...defaults, craftableOnly: true })).toHaveLength(0)
  })
  it('combines authored slot/source, search, ownership, and legal craftability', () => {
    const state = createInitialState()
    state.progress.lifetimeKillsByMonster['forest-wisp'] = 1
    const filters = { ...defaults, slotFilter: 'weapon' as const }
    expect(getVisibleArtificingRecipes(state, filters, 'ember-staff').map(recipe => recipe.id)).toEqual(['ember-staff'])
    for (const ingredient of ARTIFICING_RECIPES['ember-staff'].ingredients) state.inventory[ingredient.itemId] = ingredient.quantity
    expect(getVisibleArtificingRecipes(state, { ...filters, craftableOnly: true }).map(recipe => recipe.id)).toEqual(['ember-staff'])
    state.protectedItems['fire-fragment'] = true
    expect(getVisibleArtificingRecipes(state, { ...filters, craftableOnly: true })).toHaveLength(0)
    state.inventory['ember-staff'] = 1
    expect(getVisibleArtificingRecipes(state, { ...filters, ownershipFilter: 'owned' }).map(recipe => recipe.id)).toEqual(['ember-staff'])
    expect(getVisibleArtificingRecipes(state, { ...filters, ownershipFilter: 'unowned' }, 'ember-staff')).toHaveLength(0)
  })
})
