import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { EQUIPMENT_ITEM_SLOTS, EQUIPMENT_POSITIONS, getEquippedCount, getEquippedReservedQuantity, isPositionCompatible, normalizeEquipmentState } from './equipmentRules'

describe('equipment slot rules', () => {
  it('defines the single weapon, armor, and head loadout', () => {
    const state = createInitialState()
    expect(EQUIPMENT_POSITIONS).toEqual(['weapon', 'armor', 'head'])
    expect(EQUIPMENT_ITEM_SLOTS).toEqual(['weapon', 'armor', 'helmet'])
    expect(Object.keys(state.equipment)).toEqual(['weapon', 'armor', 'head'])
    expect(isPositionCompatible('tideglass-wand', 'weapon')).toBe(true)
    expect(isPositionCompatible('wispweave-robe', 'armor')).toBe(true)
    expect(isPositionCompatible('wispveil-hood', 'head')).toBe(true)
    expect(isPositionCompatible('ember-staff', 'armor')).toBe(false)
    expect(getEquippedCount(state)).toBe(0)
  })

  it('normalizes stale positions out of the fresh three-slot state', () => {
    const equipment = normalizeEquipmentState({ weapon: 'tideglass-wand', obsoletePosition: 'ember-staff', head: 'wispveil-hood' }, { 'tideglass-wand': 1, 'ember-staff': 1, 'wispveil-hood': 1 })
    expect(equipment).toEqual({ weapon: 'tideglass-wand', armor: null, head: 'wispveil-hood' })
    expect(getEquippedReservedQuantity({ equipment }, 'tideglass-wand')).toBe(1)
  })
})
