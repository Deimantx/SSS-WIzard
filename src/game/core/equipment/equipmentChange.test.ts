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
    ['one-handed Weapon', 'tideglass-wand' as const, 'weapon' as const],
    ['Offhand', 'prismatic-focus' as const, 'offhand' as const],
    ['Armor', 'wispweave-robe' as const, 'armor' as const],
  ])('accepts an owned compatible %s', (_label, itemId, position) => {
    const result = evaluateEquipmentChange(withOwned(itemId), itemId, position)
    expect(result).toMatchObject({ ok: true, position })
  })

  it('clears an existing Offhand for a two-handed Weapon and keeps the action in parity', () => {
    const previewState = withOwned('ember-staff')
    previewState.inventory['prismatic-focus'] = 1
    previewState.equipment.offhand = 'prismatic-focus'
    const preview = evaluateEquipmentChange(previewState, 'ember-staff')
    expect(preview).toMatchObject({ ok: true, removedOffhand: 'prismatic-focus', nextEquipment: { weapon: 'ember-staff', offhand: null } })

    const actionState = withOwned('ember-staff')
    actionState.inventory['prismatic-focus'] = 1
    actionState.equipment.offhand = 'prismatic-focus'
    const action = equipItemAction(actionState, 'ember-staff')
    expect(action).toMatchObject({ ok: true, unequippedOffhand: 'prismatic-focus' })
    expect(actionState.equipment).toEqual(preview.ok ? preview.nextEquipment : null)
  })

  it('rejects an Offhand while a two-handed Weapon is active', () => {
    const state = withOwned('prismatic-focus')
    state.equipment.weapon = 'ember-staff'
    expect(evaluateEquipmentChange(state, 'prismatic-focus')).toEqual({ ok: false, reason: 'incompatible' })
    expect(equipItemAction(state, 'prismatic-focus')).toMatchObject({ ok: false, reason: 'incompatible' })
  })

  it('rejects missing ownership and incompatible target positions', () => {
    expect(evaluateEquipmentChange(createInitialState(), 'ember-staff')).toEqual({ ok: false, reason: 'not-owned' })
    const state = withOwned('prismatic-focus')
    expect(evaluateEquipmentChange(state, 'prismatic-focus', 'helmet')).toEqual({ ok: false, reason: 'incompatible' })
    state.inventory['gravebinder-ring'] = 1
    expect(evaluateEquipmentChange(state, 'gravebinder-ring', 'helmet')).toEqual({ ok: false, reason: 'incompatible' })
  })

  it('equips one Earring and replaces it through the shared Equipment path', () => {
    const state = withOwned('wispglass-earring')
    expect(equipItemAction(state, 'wispglass-earring')).toMatchObject({ ok: true, position: 'earring' })
    state.inventory['fangwire-earring'] = 1
    expect(equipItemAction(state, 'fangwire-earring')).toMatchObject({ ok: true, position: 'earring' })
    expect(state.equipment.earring).toBe('fangwire-earring')
    expect(state.inventory['wispglass-earring']).toBe(1)
    expect(state.inventory['fangwire-earring']).toBe(1)
  })

  it('requires a ring target when both Ring positions are occupied', () => {
    const state = withOwned('gravebinder-ring', 1)
    state.equipment.ring1 = 'wispbound-ring'
    state.equipment.ring2 = 'howling-signet'
    expect(evaluateEquipmentChange(state, 'gravebinder-ring')).toEqual({ ok: false, reason: 'ring-target-required' })
  })

  it('allows one owned Ring in one position and blocks the same Ring in both positions', () => {
    const one = withOwned('gravebinder-ring', 1)
    expect(evaluateEquipmentChange(one, 'gravebinder-ring', 'ring1')).toMatchObject({ ok: true, position: 'ring1' })
    one.equipment.ring1 = 'gravebinder-ring'
    expect(evaluateEquipmentChange(one, 'gravebinder-ring', 'ring1')).toMatchObject({ ok: true, position: 'ring1' })
    expect(evaluateEquipmentChange(one, 'gravebinder-ring', 'ring2')).toEqual({ ok: false, reason: 'duplicate-ring' })

    const two = withOwned('gravebinder-ring', 2)
    two.equipment.ring1 = 'gravebinder-ring'
    expect(evaluateEquipmentChange(two, 'gravebinder-ring', 'ring2')).toEqual({ ok: false, reason: 'duplicate-ring' })
  })

  it('permits replacing one Ring copy while preserving the other reserved copy', () => {
    const state = withOwned('gravebinder-ring', 2)
    state.inventory['wispbound-ring'] = 1
    state.equipment.ring1 = 'gravebinder-ring'
    state.equipment.ring2 = 'gravebinder-ring'
    expect(evaluateEquipmentChange(state, 'wispbound-ring', 'ring1')).toMatchObject({ ok: true, position: 'ring1' })
    state.equipment.ring1 = 'wispbound-ring'
    expect(evaluateEquipmentChange(state, 'wispbound-ring', 'ring2')).toEqual({ ok: false, reason: 'duplicate-ring' })
  })

  it('never treats an unknown position as a compatible target', () => {
    const state = withOwned('ember-staff')
    expect(evaluateEquipmentChange(state, 'ember-staff', 'ring1' as EquipmentPosition)).toEqual({ ok: false, reason: 'incompatible' })
  })
})
