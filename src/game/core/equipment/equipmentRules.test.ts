import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { migrateSave } from '../../../persistence/migrations'
import { EQUIPMENT_ITEM_SLOTS, EQUIPMENT_POSITIONS, getEquippedCount, getEquippedReservedQuantity, isPositionCompatible, normalizeEquipmentState } from './equipmentRules'

describe('equipment slot rules', () => {
  it('defines the artifact and dual-accessory loadout positions', () => {
    const state = createInitialState()
    expect(EQUIPMENT_POSITIONS).toEqual(['weapon', 'armor', 'head', 'cape', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2'])
    expect(EQUIPMENT_ITEM_SLOTS).toEqual(['weapon', 'armor', 'helmet', 'cape', 'amulet', 'earring', 'ring'])
    expect(Object.keys(state.equipment)).toEqual(['weapon', 'armor', 'head', 'cape', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2'])
    expect(isPositionCompatible('tideglass-wand', 'weapon')).toBe(true)
    expect(isPositionCompatible('ember-staff', 'weapon')).toBe(true)
    expect(isPositionCompatible('ember-staff', 'armor')).toBe(false)
    expect(isPositionCompatible('wispglass-earring', 'earring1')).toBe(true)
    expect(isPositionCompatible('wispglass-earring', 'earring2')).toBe(true)
    expect(isPositionCompatible('wispglass-earring', 'ring1')).toBe(false)
    expect(isPositionCompatible('windthread-charm', 'necklace')).toBe(true)
    expect(getEquippedCount(state)).toBe(0)
  })

  it('maps old equipment slots and promotes a legacy Focus to the single Weapon slot', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 5,
      inventory: { ...initial.inventory, 'ember-staff': 1, 'wispweave-robe': 1, 'windthread-charm': 1 },
      equipment: { weapon: null, focus: 'ember-staff', robe: 'wispweave-robe', charm: 'windthread-charm' },
    })
    expect(migrated.saveVersion).toBe(8)
    expect(migrated.equipment).toEqual({ weapon: 'ember-staff', armor: 'wispweave-robe', head: null, cape: null, necklace: 'windthread-charm', earring1: null, earring2: null, ring1: null, ring2: null })
    expect(migrated.inventory['ember-staff']).toBe(1)
  })

  it('normalizes position mismatches without crashing', () => {
    const equipment = normalizeEquipmentState({ weapon: 'tideglass-wand', ring1: 'ember-staff', ring2: 'ember-staff' }, { 'tideglass-wand': 1, 'ember-staff': 1 })
    expect(equipment.ring1).toBeNull()
    expect(equipment.ring2).toBeNull()
    expect(getEquippedReservedQuantity({ equipment }, 'tideglass-wand')).toBe(1)
  })
})
