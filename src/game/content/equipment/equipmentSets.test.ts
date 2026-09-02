import { describe, expect, it } from 'vitest'
import { ITEMS } from '../items/items'
import { EQUIPMENT_BOSS_RELIC_IDS, EQUIPMENT_BY_DUNGEON, validateEquipmentSetDefinitions } from './equipmentSets'

describe('Equipment dungeon sets', () => {
  it('covers every current Equipment item exactly once', () => {
    expect(validateEquipmentSetDefinitions()).toEqual([])
    expect(EQUIPMENT_BY_DUNGEON['whispering-woods']).toHaveLength(9)
    expect(EQUIPMENT_BY_DUNGEON['howling-den']).toHaveLength(8)
    expect(EQUIPMENT_BY_DUNGEON['abandoned-catacombs']).toHaveLength(10)
    expect(new Set(Object.values(EQUIPMENT_BY_DUNGEON).flat()).size).toBe(27)
    expect(EQUIPMENT_BY_DUNGEON['abandoned-catacombs']).toEqual(expect.arrayContaining(['edrins-remnant-staff', 'edrins-signet']))
    expect(EQUIPMENT_BOSS_RELIC_IDS.every((itemId) => ITEMS[itemId]?.kind === 'equipment')).toBe(true)
  })
})
