import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { migrateSave } from '../../../persistence/migrations'
import { getEquippedCount, getEquippedReservedQuantity, isPositionCompatible, isTwoHandedWeapon, normalizeEquipmentState } from './equipmentRules'

describe('equipment slot rules', () => {
  it('defines eight loadout positions and separate ring item positions', () => {
    const state = createInitialState()
    expect(Object.keys(state.equipment)).toEqual(['weapon', 'offhand', 'armor', 'helmet', 'amulet', 'earrings', 'ring1', 'ring2'])
    expect(isPositionCompatible('apprentice-wand', 'weapon')).toBe(true)
    expect(isPositionCompatible('tide-focus', 'offhand')).toBe(true)
    expect(isPositionCompatible('tide-focus', 'armor')).toBe(false)
    expect(isTwoHandedWeapon('ember-staff')).toBe(true)
    expect(getEquippedCount(state)).toBe(1)
  })

  it('maps old equipment slots and removes an invalid 2H/offhand combination', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 5,
      inventory: { ...initial.inventory, 'ember-staff': 1, 'tide-focus': 1, 'stoneweave-robe': 1, 'windthread-charm': 1 },
      equipment: { weapon: 'ember-staff', focus: 'tide-focus', robe: 'stoneweave-robe', charm: 'windthread-charm' },
    })
    expect(migrated.saveVersion).toBe(6)
    expect(migrated.equipment).toMatchObject({ weapon: 'ember-staff', offhand: null, armor: 'stoneweave-robe', amulet: 'windthread-charm', helmet: null, earrings: null, ring1: null, ring2: null })
    expect(migrated.inventory['tide-focus']).toBe(1)
  })

  it('normalizes position mismatches without crashing', () => {
    const equipment = normalizeEquipmentState({ weapon: 'apprentice-wand', ring1: 'tide-focus', ring2: 'tide-focus' }, { 'apprentice-wand': 1, 'tide-focus': 1 })
    expect(equipment.ring1).toBeNull()
    expect(equipment.ring2).toBeNull()
    expect(getEquippedReservedQuantity({ equipment }, 'apprentice-wand')).toBe(1)
  })
})
