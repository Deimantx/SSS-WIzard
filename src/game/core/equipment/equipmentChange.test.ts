import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { equipItemAction } from '../../../store/actions/equipmentActions'
import { evaluateEquipmentChange } from './equipmentChange'

const withOwned = (itemId: keyof ReturnType<typeof createInitialState>['inventory'], quantity = 1) => {
  const state = createInitialState()
  state.inventory[itemId] = quantity
  return state
}

describe('evaluateEquipmentChange', () => {
  it('accepts and replaces items in the three canonical positions', () => {
    const state = withOwned('tideglass-wand')
    expect(evaluateEquipmentChange(state, 'tideglass-wand')).toMatchObject({ ok: true, position: 'weapon' })
    state.inventory['ember-staff'] = 1
    state.equipment.weapon = 'ember-staff'
    expect(equipItemAction(state, 'tideglass-wand')).toMatchObject({ ok: true, position: 'weapon' })
    expect(state.equipment.weapon).toBe('tideglass-wand')
  })

  it('rejects missing ownership and incompatible positions', () => {
    expect(evaluateEquipmentChange(createInitialState(), 'ember-staff')).toEqual({ ok: false, reason: 'not-owned' })
    const state = withOwned('tideglass-wand')
    expect(evaluateEquipmentChange(state, 'tideglass-wand', 'head')).toEqual({ ok: false, reason: 'incompatible' })
    expect(evaluateEquipmentChange(state, 'wispveil-hood', 'head')).toEqual({ ok: false, reason: 'not-owned' })
  })

  it('does not create duplicate or replacement rules beyond the three slots', () => {
    const state = withOwned('wispweave-robe')
    state.equipment.armor = 'wispweave-robe'
    expect(evaluateEquipmentChange(state, 'wispweave-robe', 'armor')).toMatchObject({ ok: true, position: 'armor' })
    expect(Object.keys(state.equipment)).toEqual(['weapon', 'armor', 'head'])
  })
})
