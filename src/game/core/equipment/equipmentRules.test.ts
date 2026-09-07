import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { migrateSave } from '../../../persistence/migrations'
import { EQUIPMENT_ITEM_SLOTS, EQUIPMENT_POSITIONS, getEquippedCount, getEquippedReservedQuantity, isPositionCompatible, isTwoHandedWeapon, normalizeEquipmentState } from './equipmentRules'

describe('equipment slot rules', () => {
  it('defines loadout positions including one Earring and separate ring item positions', () => {
    const state = createInitialState()
    expect(EQUIPMENT_POSITIONS).toEqual(['weapon', 'offhand', 'armor', 'helmet', 'cape', 'amulet', 'earring', 'ring1', 'ring2'])
    expect(EQUIPMENT_ITEM_SLOTS).toEqual(['weapon', 'offhand', 'armor', 'helmet', 'cape', 'amulet', 'earring', 'ring'])
    expect(Object.keys(state.equipment)).toEqual(['weapon', 'offhand', 'armor', 'helmet', 'cape', 'amulet', 'earring', 'ring1', 'ring2'])
    expect(isPositionCompatible('tideglass-wand', 'weapon')).toBe(true)
    expect(isPositionCompatible('prismatic-focus', 'offhand')).toBe(true)
    expect(isPositionCompatible('prismatic-focus', 'armor')).toBe(false)
    expect(isTwoHandedWeapon('ember-staff')).toBe(true)
    expect(getEquippedCount(state)).toBe(0)
  })

  it('maps old equipment slots and removes an invalid 2H/offhand combination', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 5,
      inventory: { ...initial.inventory, 'ember-staff': 1, 'prismatic-focus': 1, 'wispweave-robe': 1, 'windthread-charm': 1 },
      equipment: { weapon: 'ember-staff', focus: 'prismatic-focus', robe: 'wispweave-robe', charm: 'windthread-charm' },
    })
    expect(migrated.saveVersion).toBe(8)
    expect(migrated.equipment).toMatchObject({ weapon: 'ember-staff', offhand: null, armor: 'wispweave-robe', amulet: 'windthread-charm', helmet: null, cape: null, ring1: null, ring2: null })
    expect(migrated.inventory['prismatic-focus']).toBe(1)
  })

  it('normalizes position mismatches without crashing', () => {
    const equipment = normalizeEquipmentState({ weapon: 'tideglass-wand', ring1: 'prismatic-focus', ring2: 'prismatic-focus' }, { 'tideglass-wand': 1, 'prismatic-focus': 1 })
    expect(equipment.ring1).toBeNull()
    expect(equipment.ring2).toBeNull()
    expect(getEquippedReservedQuantity({ equipment }, 'tideglass-wand')).toBe(1)
  })
})
