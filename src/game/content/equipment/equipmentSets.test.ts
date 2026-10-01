import { describe, expect, it } from 'vitest'
import { ARTIFACT_EQUIPMENT_IDS, validateEquipmentSetDefinitions } from './equipmentSets'
import { ITEMS } from '../items/items'

describe('Equipment content ownership', () => {
  it('contains only permanent Artifact Equipment', () => {
    expect(validateEquipmentSetDefinitions()).toEqual([])
    expect(ARTIFACT_EQUIPMENT_IDS).toHaveLength(12)
    expect(ARTIFACT_EQUIPMENT_IDS.every((itemId) => ITEMS[itemId]?.kind === 'equipment')).toBe(true)
  })
})
