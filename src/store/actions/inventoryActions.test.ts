import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import { equipItemAction } from './equipmentActions'
import { destroyItemAction, getActionableQuantity, sellItemAction, toggleItemProtectionAction } from './inventoryActions'

describe('inventory transactions', () => {
  it('sells a safe quantity atomically for Gold', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 17

    expect(sellItemAction(state, 'fire-fragment', 5)).toBe(5)
    expect(state.inventory['fire-fragment']).toBe(12)
    expect(state.currencies.gold).toBe(5)
    expect(state.notifications).toHaveLength(1)
  })

  it('blocks selling a manually protected stack', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 17
    toggleItemProtectionAction(state, 'fire-fragment')

    expect(sellItemAction(state, 'fire-fragment', 5)).toBe(0)
    expect(state.inventory['fire-fragment']).toBe(17)
    expect(state.currencies.gold).toBe(0)
  })

  it('reserves only the equipped copy when selling duplicates', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 3
    equipItemAction(state, 'ember-staff')

    expect(getActionableQuantity(state, 'ember-staff')).toBe(2)
    expect(sellItemAction(state, 'ember-staff', 3)).toBe(2)
    expect(state.inventory['ember-staff']).toBe(1)
    expect(state.equipment.weapon).toBe('ember-staff')
    expect(state.currencies.gold).toBe(80)
  })

  it('destroys without affecting Gold', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 17

    expect(destroyItemAction(state, 'fire-fragment', 6)).toBe(6)
    expect(state.inventory['fire-fragment']).toBe(11)
    expect(state.currencies.gold).toBe(0)
  })

  it('blocks protected and starter-item destruction', () => {
    const protectedState = createInitialState()
    protectedState.inventory['fire-fragment'] = 17
    toggleItemProtectionAction(protectedState, 'fire-fragment')
    expect(destroyItemAction(protectedState, 'fire-fragment', 6)).toBe(0)
    expect(protectedState.inventory['fire-fragment']).toBe(17)

    const starterState = createInitialState()
    expect(destroyItemAction(starterState, 'apprentice-wand', 1)).toBe(0)
    expect(starterState.inventory['apprentice-wand']).toBe(1)
  })
})
