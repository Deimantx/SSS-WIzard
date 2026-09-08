import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { ARTIFICING_RECIPES } from '../../content/recipes/artificingRecipes'
import { canCraftArtificingRecipe, DEFAULT_ARTIFICING_FILTERS as defaults, getArtificingCatalogRecipeState, getArtificingCraftIngredients, getArtificingFilterCounts, getVisibleArtificingRecipes } from './artificingSelectors'
import { startArtificingCraft } from './artificingEngine'

const unlockWhisperingWoodsRecipes = (state: ReturnType<typeof createInitialState>) => { state.progress.lifetimeKillsByMonster['forest-wisp'] = 1 }
const provideIngredients = (state: ReturnType<typeof createInitialState>, recipeId: keyof typeof ARTIFICING_RECIPES) => getArtificingCraftIngredients(recipeId)?.forEach(({ itemId, quantity }) => { state.inventory[itemId] = (state.inventory[itemId] ?? 0) + quantity })

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

  it('separates material readiness from action availability and reports Artifact states', () => {
    const state = createInitialState()
    unlockWhisperingWoodsRecipes(state)
    provideIngredients(state, 'ember-staff')

    const ready = getArtificingCatalogRecipeState(state, 'ember-staff')
    expect(ready?.status).toBe('READY')
    expect(ready?.materialReady).toBe(true)
    expect(ready?.canStartNow).toBe(true)

    state.inventory['ember-staff'] = 1
    state.artifactProgress['ember-staff'] = { level: 3, allocatedNodeIds: [], attunedNodeIds: [] }
    const forged = getArtificingCatalogRecipeState(state, 'ember-staff')
    expect(forged?.status).toBe('FORGED')
    expect(forged?.artifactLevel).toBe(3)
    expect(forged?.artifactMaxLevel).toBe(10)
    expect(canCraftArtificingRecipe(state, 'ember-staff')).toBe(false)
  })

  it('reports an unlocked Artifact as MISSING only when forge materials are short', () => {
    const state = createInitialState()
    unlockWhisperingWoodsRecipes(state)
    const recipe = getArtificingCatalogRecipeState(state, 'ember-staff')
    expect(recipe?.status).toBe('MISSING')
    expect(recipe?.materialReady).toBe(false)
  })

  it('keeps another materially-ready recipe READY while a different craft is active', () => {
    const state = createInitialState()
    unlockWhisperingWoodsRecipes(state)
    provideIngredients(state, 'ember-staff')
    provideIngredients(state, 'windthread-charm')
    expect(startArtificingCraft(state, 'windthread-charm').ok).toBe(true)

    const ember = getArtificingCatalogRecipeState(state, 'ember-staff')
    const windthread = getArtificingCatalogRecipeState(state, 'windthread-charm')
    expect(ember?.status).toBe('READY')
    expect(ember?.materialReady).toBe(true)
    expect(ember?.canStartNow).toBe(false)
    expect(windthread?.status).toBe('CRAFTING')
  })

  it('reports MISSING after start-time material consumption makes a second recipe short', () => {
    const state = createInitialState()
    unlockWhisperingWoodsRecipes(state)
    provideIngredients(state, 'windthread-charm')
    provideIngredients(state, 'grovekeeper-mantle')
    state.inventory['thorn-fiber'] = 12
    state.inventory['grove-bark'] = 14
    expect(getArtificingCatalogRecipeState(state, 'grovekeeper-mantle')?.status).toBe('READY')
    expect(startArtificingCraft(state, 'windthread-charm').ok).toBe(true)
    expect(getArtificingCatalogRecipeState(state, 'grovekeeper-mantle')?.status).toBe('MISSING')
  })

  it('keeps the Craftable filter and count based on material readiness while busy', () => {
    const state = createInitialState()
    unlockWhisperingWoodsRecipes(state)
    provideIngredients(state, 'ember-staff')
    provideIngredients(state, 'windthread-charm')
    expect(startArtificingCraft(state, 'windthread-charm').ok).toBe(true)
    const filters = { ...defaults, kindFilter: 'artifact' as const, craftableOnly: true }
    expect(getVisibleArtificingRecipes(state, filters).map((recipe) => recipe.id)).toEqual(['ember-staff'])
    expect(getArtificingFilterCounts(state, filters).craftable).toBe(1)
  })
})
