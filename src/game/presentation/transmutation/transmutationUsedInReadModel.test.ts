import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getItemUses } from '../../content/items/inventoryMetadata'
import { getVisibleItemUsesForTransmutation } from './transmutationUsedInReadModel'

describe('Transmutation Used In read model', () => {
  it('keeps recipe identity in metadata and hides locked recipe uses normally', () => {
    const state = createInitialState()
    const allUses = getItemUses('fire-fragment')
    const visibleUses = getVisibleItemUsesForTransmutation(state, 'fire-fragment')

    expect(allUses.find((use) => use.label === 'Ember Staff')?.recipeId).toBe('ember-staff')
    expect(visibleUses.some((use) => use.label === 'Ember Staff')).toBe(false)
    expect(visibleUses.some((use) => use.label === 'Prismatic Fragment')).toBe(true)
  })

  it('reveals locked recipe uses only with the Developer Tools override and marks them locked', () => {
    const state = createInitialState()
    state.debug.showLockedTransmutationRecipes = true
    const visibleUses = getVisibleItemUsesForTransmutation(state, 'fire-fragment')

    expect(visibleUses.find((use) => use.label === 'Ember Staff')).toMatchObject({ locked: true, recipeId: 'ember-staff', detail: 'Transmutation recipe · Equipment' })
    expect(visibleUses.some((use) => use.label === 'Pillars of Mana')).toBe(true)
  })
})
