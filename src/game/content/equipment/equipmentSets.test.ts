import { describe, expect, it } from 'vitest'
import { ITEMS } from '../items/items'
import { ARTIFACT_EQUIPMENT_IDS, BOSS_SIGNATURE_EQUIPMENT_IDS, DUNGEON_EQUIPMENT_BY_DUNGEON, validateEquipmentSetDefinitions } from './equipmentSets'

describe('Equipment origin groups', () => {
  it('separates starter Artifacts from direct dungeon Equipment', () => {
    expect(validateEquipmentSetDefinitions()).toEqual([])
    expect(ARTIFACT_EQUIPMENT_IDS).toHaveLength(6)
    expect(DUNGEON_EQUIPMENT_BY_DUNGEON['whispering-woods']).toHaveLength(5)
    expect(DUNGEON_EQUIPMENT_BY_DUNGEON['howling-den']).toHaveLength(4)
    expect(DUNGEON_EQUIPMENT_BY_DUNGEON['abandoned-catacombs']).toHaveLength(5)
    expect(new Set(Object.values(DUNGEON_EQUIPMENT_BY_DUNGEON).flat()).size).toBe(14)
    expect(DUNGEON_EQUIPMENT_BY_DUNGEON['abandoned-catacombs']).toEqual(expect.arrayContaining(['ossuary-mantle', 'mourning-glass-earring', 'edrins-signet', 'soulglass-amulet']))
    expect(BOSS_SIGNATURE_EQUIPMENT_IDS.every((itemId) => ITEMS[itemId]?.kind === 'equipment')).toBe(true)
  })
})
