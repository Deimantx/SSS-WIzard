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
    ['Weapon', 'tideglass-wand' as const, 'weapon' as const],
    ['Armor', 'wispweave-robe' as const, 'armor' as const],
  ])('accepts an owned compatible %s', (_label, itemId, position) => {
    const result = evaluateEquipmentChange(withOwned(itemId), itemId, position)
    expect(result).toMatchObject({ ok: true, position })
  })

  it('replaces the current Weapon without removing a secondary item', () => {
    const state = withOwned('tideglass-wand')
    state.inventory['ember-staff'] = 1
    state.equipment.weapon = 'ember-staff'
    const preview = evaluateEquipmentChange(state, 'tideglass-wand')
    expect(preview).toMatchObject({ ok: true, position: 'weapon', nextEquipment: { weapon: 'tideglass-wand' } })
    const action = equipItemAction(state, 'tideglass-wand')
    expect(action).toEqual({ ok: true, position: 'weapon' })
    expect(state.equipment.weapon).toBe('tideglass-wand')
  })

  it('rejects missing ownership and incompatible target positions', () => {
    expect(evaluateEquipmentChange(createInitialState(), 'ember-staff')).toEqual({ ok: false, reason: 'not-owned' })
    const state = withOwned('tideglass-wand')
    expect(evaluateEquipmentChange(state, 'tideglass-wand', 'head')).toEqual({ ok: false, reason: 'incompatible' })
    state.inventory['gravebinder-ring'] = 1
    expect(evaluateEquipmentChange(state, 'gravebinder-ring', 'head')).toEqual({ ok: false, reason: 'incompatible' })
    state.inventory['windthread-charm'] = 1
    expect(evaluateEquipmentChange(state, 'windthread-charm', 'ring1')).toEqual({ ok: false, reason: 'incompatible' })
    state.inventory['wispglass-earring'] = 1
    expect(evaluateEquipmentChange(state, 'wispglass-earring', 'ring1')).toEqual({ ok: false, reason: 'incompatible' })
  })

  it('equips Earrings into separate positions through the shared Equipment path', () => {
    const state = withOwned('wispglass-earring')
    expect(equipItemAction(state, 'wispglass-earring')).toMatchObject({ ok: true, position: 'earring1' })
    state.inventory['fangwire-earring'] = 1
    expect(equipItemAction(state, 'fangwire-earring')).toMatchObject({ ok: true, position: 'earring2' })
    expect(state.equipment.earring1).toBe('wispglass-earring')
    expect(state.equipment.earring2).toBe('fangwire-earring')
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

  it('requires an Earring target when both Earring positions are occupied', () => {
    const state = withOwned('wispglass-earring', 1)
    state.equipment.earring1 = 'fangwire-earring'
    state.equipment.earring2 = 'mourning-glass-earring'
    expect(evaluateEquipmentChange(state, 'wispglass-earring')).toEqual({ ok: false, reason: 'earring-target-required' })
    expect(evaluateEquipmentChange(state, 'wispglass-earring', 'earring1')).toMatchObject({ ok: true, position: 'earring1' })
    state.equipment.earring1 = 'wispglass-earring'
    expect(evaluateEquipmentChange(state, 'wispglass-earring', 'earring2')).toEqual({ ok: false, reason: 'duplicate-earring' })
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
