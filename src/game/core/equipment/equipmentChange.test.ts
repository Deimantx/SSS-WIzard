import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { equipItemAction } from '../../../store/actions/equipmentActions'
import type { EquipmentPosition } from '../../types'
import { evaluateEquipmentChange } from './equipmentChange'

const withOwned = (itemId: keyof ReturnType<typeof createInitialState>['inventory'], quantity = 1) => {
  const state = createInitialState()
  state.inventory[itemId] = quantity
  return state
}

describe('evaluateEquipmentChange', () => {
  it.each([
    ['one-handed Weapon', 'wispwood-wand' as const, 'weapon' as const],
    ['Offhand', 'tide-focus' as const, 'offhand' as const],
    ['Armor', 'stoneweave-robe' as const, 'armor' as const],
  ])('accepts an owned compatible %s', (_label, itemId, position) => {
    const result = evaluateEquipmentChange(withOwned(itemId), itemId, position)
    expect(result).toMatchObject({ ok: true, position })
  })

  it('clears an existing Offhand for a two-handed Weapon and keeps the action in parity', () => {
    const previewState = withOwned('ember-staff')
    previewState.inventory['tide-focus'] = 1
    previewState.equipment.offhand = 'tide-focus'
    const preview = evaluateEquipmentChange(previewState, 'ember-staff')
    expect(preview).toMatchObject({ ok: true, removedOffhand: 'tide-focus', nextEquipment: { weapon: 'ember-staff', offhand: null } })

    const actionState = withOwned('ember-staff')
    actionState.inventory['tide-focus'] = 1
    actionState.equipment.offhand = 'tide-focus'
    const action = equipItemAction(actionState, 'ember-staff')
    expect(action).toMatchObject({ ok: true, unequippedOffhand: 'tide-focus' })
    expect(actionState.equipment).toEqual(preview.ok ? preview.nextEquipment : null)
  })

  it('rejects an Offhand while a two-handed Weapon is active', () => {
    const state = withOwned('tide-focus')
    state.equipment.weapon = 'ember-staff'
    expect(evaluateEquipmentChange(state, 'tide-focus')).toEqual({ ok: false, reason: 'incompatible' })
    expect(equipItemAction(state, 'tide-focus')).toMatchObject({ ok: false, reason: 'incompatible' })
  })

  it('rejects missing ownership and incompatible target positions', () => {
    expect(evaluateEquipmentChange(createInitialState(), 'ember-staff')).toEqual({ ok: false, reason: 'not-owned' })
    const state = withOwned('tide-focus')
    expect(evaluateEquipmentChange(state, 'tide-focus', 'helmet')).toEqual({ ok: false, reason: 'incompatible' })
    state.inventory['gravebinder-ring'] = 1
    expect(evaluateEquipmentChange(state, 'gravebinder-ring', 'helmet')).toEqual({ ok: false, reason: 'incompatible' })
  })

  it('requires a ring target when both Ring positions are occupied', () => {
    const state = withOwned('gravebinder-ring', 1)
    state.equipment.ring1 = 'wispbound-ring'
    state.equipment.ring2 = 'howling-signet'
    expect(evaluateEquipmentChange(state, 'gravebinder-ring')).toEqual({ ok: false, reason: 'ring-target-required' })
  })

  it('allows one owned Ring in one position and two owned copies in both positions', () => {
    const one = withOwned('gravebinder-ring', 1)
    expect(evaluateEquipmentChange(one, 'gravebinder-ring', 'ring1')).toMatchObject({ ok: true, position: 'ring1' })
    one.equipment.ring1 = 'gravebinder-ring'
    expect(evaluateEquipmentChange(one, 'gravebinder-ring', 'ring1')).toMatchObject({ ok: true, position: 'ring1' })
    expect(evaluateEquipmentChange(one, 'gravebinder-ring', 'ring2')).toEqual({ ok: false, reason: 'insufficient-copies' })

    const two = withOwned('gravebinder-ring', 2)
    two.equipment.ring1 = 'gravebinder-ring'
    expect(evaluateEquipmentChange(two, 'gravebinder-ring', 'ring2')).toMatchObject({ ok: true, position: 'ring2' })
  })

  it('permits replacing one Ring copy while preserving the other reserved copy', () => {
    const state = withOwned('gravebinder-ring', 2)
    state.inventory['wispbound-ring'] = 1
    state.equipment.ring1 = 'gravebinder-ring'
    state.equipment.ring2 = 'gravebinder-ring'
    expect(evaluateEquipmentChange(state, 'wispbound-ring', 'ring1')).toMatchObject({ ok: true, position: 'ring1' })
    state.equipment.ring1 = 'wispbound-ring'
    expect(evaluateEquipmentChange(state, 'wispbound-ring', 'ring2')).toEqual({ ok: false, reason: 'insufficient-copies' })
  })

  it('never treats an unknown position as a compatible target', () => {
    const state = withOwned('ember-staff')
    expect(evaluateEquipmentChange(state, 'ember-staff', 'ring1' as EquipmentPosition)).toEqual({ ok: false, reason: 'incompatible' })
  })
})
