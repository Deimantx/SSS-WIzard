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
    expect(getVisibleArtificingRecipes(state)).toHaveLength(21)
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

  it('returns exactly the three Earring recipes when locked recipes are shown', () => {
    const state = createInitialState()
    const recipes = getVisibleArtificingRecipes(state, { ...defaults, slotFilter: 'earring' }, '', true)

    expect(recipes.map((recipe) => recipe.output.itemId)).toEqual([
      'wispglass-earring',
      'fangwire-earring',
      'mourning-glass-earring',
    ])
  })

  it('filters by player-facing tier and composes with the Earring slot filter', () => {
    const state = createInitialState()
    state.debug.showLockedArtificingRecipes = true

    expect(getVisibleArtificingRecipes(state)).toHaveLength(21)
    expect(getVisibleArtificingRecipes(state, { ...defaults, tierFilter: 1 })).toHaveLength(21)
    expect(getVisibleArtificingRecipes(state, { ...defaults, tierFilter: 2 })).toHaveLength(0)
    expect(getVisibleArtificingRecipes(state, { ...defaults, tierFilter: 3 })).toHaveLength(0)
    expect(getVisibleArtificingRecipes(state, { ...defaults, slotFilter: 'earring', tierFilter: 1 }, '', true).map(recipe => recipe.output.itemId)).toEqual([
      'wispglass-earring',
      'fangwire-earring',
      'mourning-glass-earring',
    ])
    expect(getVisibleArtificingRecipes(state, { ...defaults, slotFilter: 'earring', tierFilter: 2 }, '', true)).toHaveLength(0)
  })
})
