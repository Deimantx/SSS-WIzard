import { describe, expect, it } from 'vitest'
import { RECIPES } from '../../content/recipes/recipes'
import { createInitialState } from '../../../store/initialState'
import { getTransmutationRecipeFilterCounts, getVisibleTransmutationRecipes, type TransmutationRecipeFilters } from './transmutationSelectors'

const allFilters: TransmutationRecipeFilters = { categoryFilter: 'all', equipmentSlotFilter: 'all', weaponHandsFilter: 'all', offhandPresentationFilter: 'all', materialTierFilter: 'all', craftableOnly: false, activeOnly: false }

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
    expect(getVisibleTransmutationRecipes(state, { ...allFilters, categoryFilter: 'material', materialTierFilter: 1 }).every((recipe) => recipe.category === 'material')).toBe(true)
    expect(getVisibleTransmutationRecipes(state, { ...allFilters, activeOnly: true }).map((recipe) => recipe.id)).toEqual(['ember-staff'])
  })

  it('keeps authored metadata authoritative for equipment context and material tiers', () => {
    const state = createInitialState()
    state.progress.lifetimeKillsByMonster['grove-sentinel'] = 1
    const counts = getTransmutationRecipeFilterCounts(state, allFilters)
    expect(counts.equipmentSlots.weapon).toBeGreaterThan(0)
    expect(counts.weaponHands[2]).toBeGreaterThan(0)
    expect(counts.materialTiers[1]).toBeGreaterThan(0)
    expect(RECIPES['fire-fragment'].category).toBe('elemental')
  })
})
