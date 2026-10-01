import { describe, expect, it } from 'vitest'
import { ARTIFACT_ITEM_ORDER } from '../artifacts/artifacts'
import { validateEquipmentSetDefinitions } from './equipmentSets'
import { ITEMS } from '../items/items'

describe('Equipment content ownership', () => {
  it('contains only permanent Artifact Equipment', () => {
    expect(validateEquipmentSetDefinitions()).toEqual([])
    expect(ARTIFACT_ITEM_ORDER).toHaveLength(12)
    expect(ARTIFACT_ITEM_ORDER.every((itemId) => ITEMS[itemId]?.kind === 'equipment')).toBe(true)
  })
})
