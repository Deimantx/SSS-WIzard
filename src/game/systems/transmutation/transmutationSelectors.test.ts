import { describe, expect, it } from 'vitest'
import { RECIPES } from '../../content/recipes/recipes'
import { createInitialState } from '../../../store/initialState'
import { getRecipeMaterialCapacity, getTransmutationRecipeFilterCounts, getVisibleTransmutationRecipes, type TransmutationRecipeFilters } from './transmutationSelectors'

const allFilters: TransmutationRecipeFilters = { categoryFilter: 'all', equipmentSlotFilter: 'all', weaponHandsFilter: 'all', offhandPresentationFilter: 'all', tierFilter: 'all', craftableOnly: false, activeOnly: false, unownedOnly: false }

describe('Transmutation recipe filter read model', () => {
  it('hides locked recipes in normal play and reveals them only for the developer override', () => {
    const state = createInitialState()
    expect(getVisibleTransmutationRecipes(state, allFilters).some((recipe) => recipe.id === 'ember-staff')).toBe(false)
    expect(getVisibleTransmutationRecipes(state, allFilters, '', true).some((recipe) => recipe.id === 'ember-staff')).toBe(true)
    expect(getTransmutationRecipeFilterCounts(state, allFilters).hiddenLocked).toBeGreaterThan(0)
  })

  it('intersects category, equipment context, tier, active, and search filters', () => {
    const state = createInitialState()
    state.progress.lifetimeKillsByMonster['grove-sentinel'] = 1
    state.activities.transmutation.jobs['ember-staff'] = { echoesAssigned: 1, progressMs: 0 }
    const equipment = getVisibleTransmutationRecipes(state, { ...allFilters, categoryFilter: 'equipment', equipmentSlotFilter: 'weapon', weaponHandsFilter: 2 }, 'ember')
    expect(equipment.map((recipe) => recipe.id)).toEqual(['ember-staff'])
    expect(getVisibleTransmutationRecipes(state, { ...allFilters, categoryFilter: 'material', tierFilter: 1 }).every((recipe) => recipe.category === 'material')).toBe(true)
    expect(getVisibleTransmutationRecipes(state, { ...allFilters, activeOnly: true }).map((recipe) => recipe.id)).toEqual(['ember-staff'])
  })

  it('keeps authored metadata authoritative for equipment context and material tiers', () => {
    const state = createInitialState()
    state.progress.lifetimeKillsByMonster['grove-sentinel'] = 1
    const counts = getTransmutationRecipeFilterCounts(state, allFilters)
    expect(counts.equipmentSlots.weapon).toBeGreaterThan(0)
    expect(counts.weaponHands[2]).toBeGreaterThan(0)
    expect(counts.tierCounts.material[1]).toBeGreaterThan(0)
    expect(RECIPES['fire-fragment'].category).toBe('elemental')
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

  it('treats equipped equipment as owned for the Unowned filter', () => {
    const state = createInitialState()
    state.progress.lifetimeKillsByMonster['grove-sentinel'] = 1
    state.inventory['ember-staff'] = 0
    state.equipment.weapon = 'ember-staff'
    const unowned = getVisibleTransmutationRecipes(state, { ...allFilters, categoryFilter: 'equipment', unownedOnly: true })
    expect(unowned.some((recipe) => recipe.id === 'ember-staff')).toBe(false)
    state.equipment.weapon = null
    expect(getVisibleTransmutationRecipes(state, { ...allFilters, categoryFilter: 'equipment', unownedOnly: true }).some((recipe) => recipe.id === 'ember-staff')).toBe(true)
  })
})
