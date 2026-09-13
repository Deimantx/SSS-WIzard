import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { ARTIFICING_RECIPES, ARTIFICING_RECIPE_ORDER } from '../../content/recipes/artificingRecipes'
import { canCraftArtificingRecipe, DEFAULT_ARTIFICING_FILTERS as defaults, getArtificingCatalogRecipeState, getArtificingCraftIngredients, getArtificingFilterCounts, getVisibleArtificingRecipes } from './artificingSelectors'
import { startArtificingCraft } from './artificingEngine'

const provideIngredients = (state: ReturnType<typeof createInitialState>, recipeId: keyof typeof ARTIFICING_RECIPES) => getArtificingCraftIngredients(recipeId)?.forEach(({ itemId, quantity }) => { state.inventory[itemId] = (state.inventory[itemId] ?? 0) + quantity })

describe('Artificing Artifact catalog', () => {
  it('shows only the six current Artifact recipes on a fresh save', () => {
    const state = createInitialState()
    expect(getVisibleArtificingRecipes(state).map((recipe) => recipe.id)).toEqual([...ARTIFICING_RECIPE_ORDER])
    expect(getVisibleArtificingRecipes(state, { ...defaults, kindFilter: 'artifact' })).toHaveLength(6)
    expect(getVisibleArtificingRecipes(state, { ...defaults, kindFilter: 'artifact' })).toHaveLength(6)
  })

  it('filters by tier, slot, ownership, search, and legal craftability', () => {
    const state = createInitialState()
    const filters = { ...defaults, slotFilter: 'weapon' as const }
    expect(getVisibleArtificingRecipes(state, filters, 'ember-staff').map((recipe) => recipe.id)).toEqual(['ember-staff'])
    provideIngredients(state, 'ember-staff')
    expect(getVisibleArtificingRecipes(state, { ...filters, craftableOnly: true }).map((recipe) => recipe.id)).toEqual(['ember-staff'])
    state.protectedItems['fire-fragment'] = true
    expect(getVisibleArtificingRecipes(state, { ...filters, craftableOnly: true })).toHaveLength(0)
    state.protectedItems['fire-fragment'] = false
    state.inventory['ember-staff'] = 1
    state.artifactProgress['ember-staff'] = { level: 1, allocatedNodeIds: [], attunedNodeIds: [] }
    expect(getVisibleArtificingRecipes(state, { ...filters, ownershipFilter: 'owned' }).map((recipe) => recipe.id)).toEqual(['ember-staff'])
    expect(getVisibleArtificingRecipes(state, { ...filters, ownershipFilter: 'unowned' }, 'ember-staff')).toHaveLength(0)
    expect(getVisibleArtificingRecipes(state, { ...defaults, tierFilter: 1 })).toHaveLength(6)
    expect(getVisibleArtificingRecipes(state, { ...defaults, tierFilter: 2 })).toHaveLength(0)
  })

  it('separates material readiness from action availability while an Artifact forge is active', () => {
    const state = createInitialState()
    provideIngredients(state, 'ember-staff')
    provideIngredients(state, 'windthread-wand')
    expect(getArtificingCatalogRecipeState(state, 'ember-staff')?.status).toBe('READY')
    expect(canCraftArtificingRecipe(state, 'ember-staff')).toBe(true)
    expect(startArtificingCraft(state, 'windthread-wand').ok).toBe(true)
    const ember = getArtificingCatalogRecipeState(state, 'ember-staff')
    expect(ember?.status).toBe('READY')
    expect(ember?.materialReady).toBe(true)
    expect(ember?.canStartNow).toBe(false)
    expect(getArtificingCatalogRecipeState(state, 'windthread-wand')?.status).toBe('FORGING')
    expect(getArtificingFilterCounts(state, { ...defaults, craftableOnly: true }).craftable).toBe(1)
  })

  it('reports a forged Artifact and a missing starter forge correctly', () => {
    const state = createInitialState()
    const missing = getArtificingCatalogRecipeState(state, 'ember-staff')
    expect(missing?.status).toBe('MISSING')
    expect(missing?.materialReady).toBe(false)
    state.inventory['ember-staff'] = 1
    state.artifactProgress['ember-staff'] = { level: 3, allocatedNodeIds: [], attunedNodeIds: [] }
    const forged = getArtificingCatalogRecipeState(state, 'ember-staff')
    expect(forged?.status).toBe('FORGED')
    expect(forged?.artifactLevel).toBe(3)
    expect(forged?.artifactMaxLevel).toBe(10)
  })
})
