import { describe, expect, it } from 'vitest'
import { ITEMS } from '../items/items'
import { EQUIPMENT_BOSS_RELIC_IDS, EQUIPMENT_BY_DUNGEON, validateEquipmentSetDefinitions } from './equipmentSets'

describe('Equipment dungeon sets', () => {
  it('covers every current Equipment item exactly once', () => {
    expect(validateEquipmentSetDefinitions()).toEqual([])
    expect(EQUIPMENT_BY_DUNGEON['whispering-woods']).toHaveLength(11)
    expect(EQUIPMENT_BY_DUNGEON['howling-den']).toHaveLength(3)
    expect(EQUIPMENT_BY_DUNGEON['abandoned-catacombs']).toHaveLength(4)
    expect(new Set(Object.values(EQUIPMENT_BY_DUNGEON).flat()).size).toBe(18)
    expect(EQUIPMENT_BY_DUNGEON['abandoned-catacombs']).toEqual(expect.arrayContaining(['ossuary-mantle', 'edrins-signet']))
    expect(EQUIPMENT_BOSS_RELIC_IDS.every((itemId) => ITEMS[itemId]?.kind === 'equipment')).toBe(true)
  })
})
