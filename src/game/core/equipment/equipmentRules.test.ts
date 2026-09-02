import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { migrateSave } from '../../../persistence/migrations'
import { EQUIPMENT_ITEM_SLOTS, EQUIPMENT_POSITIONS, getEquippedCount, getEquippedReservedQuantity, isPositionCompatible, isTwoHandedWeapon, normalizeEquipmentState } from './equipmentRules'

describe('equipment slot rules', () => {
  it('defines eight loadout positions and separate ring item positions', () => {
    const state = createInitialState()
    expect(EQUIPMENT_POSITIONS).toEqual(['weapon', 'offhand', 'armor', 'helmet', 'cape', 'amulet', 'ring1', 'ring2'])
    expect(EQUIPMENT_ITEM_SLOTS).toEqual(['weapon', 'offhand', 'armor', 'helmet', 'cape', 'amulet', 'ring'])
    expect(Object.keys(state.equipment)).toEqual(['weapon', 'offhand', 'armor', 'helmet', 'cape', 'amulet', 'ring1', 'ring2'])
    expect(isPositionCompatible('wispwood-wand', 'weapon')).toBe(true)
    expect(isPositionCompatible('tide-focus', 'offhand')).toBe(true)
    expect(isPositionCompatible('tide-focus', 'armor')).toBe(false)
    expect(isTwoHandedWeapon('ember-staff')).toBe(true)
    expect(getEquippedCount(state)).toBe(0)
  })

  it('maps old equipment slots and removes an invalid 2H/offhand combination', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 5,
      inventory: { ...initial.inventory, 'ember-staff': 1, 'tide-focus': 1, 'stoneweave-robe': 1, 'windthread-charm': 1 },
      equipment: { weapon: 'ember-staff', focus: 'tide-focus', robe: 'stoneweave-robe', charm: 'windthread-charm' },
    })
    expect(migrated.saveVersion).toBe(8)
    expect(migrated.equipment).toMatchObject({ weapon: 'ember-staff', offhand: null, armor: 'stoneweave-robe', amulet: 'windthread-charm', helmet: null, cape: null, ring1: null, ring2: null })
    expect(migrated.inventory['tide-focus']).toBe(1)
  })

  it('normalizes position mismatches without crashing', () => {
    const equipment = normalizeEquipmentState({ weapon: 'wispwood-wand', ring1: 'tide-focus', ring2: 'tide-focus' }, { 'wispwood-wand': 1, 'tide-focus': 1 })
    expect(equipment.ring1).toBeNull()
    expect(equipment.ring2).toBeNull()
    expect(getEquippedReservedQuantity({ equipment }, 'wispwood-wand')).toBe(1)
  })
})
