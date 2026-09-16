import { describe, expect, it } from 'vitest'
import { ITEMS } from '../game/content/items/items'
import { isPositionCompatible } from '../game/core/equipment/equipmentRules'
import { DEVELOPER_LOADOUTS } from './developerLoadouts'
import type { EquipmentPosition } from '../game/types'

describe('developer equipment loadouts', () => {
  it('references existing Equipment in compatible current positions', () => {
    DEVELOPER_LOADOUTS.forEach((loadout) => Object.entries(loadout.slots).forEach(([position, itemId]) => {
      if (!itemId) return
      expect(ITEMS[itemId]).toBeDefined()
      expect(isPositionCompatible(itemId, position as EquipmentPosition)).toBe(true)
    }))
    expect(DEVELOPER_LOADOUTS.every((loadout) => Object.keys(loadout.slots).every((position) => ['weapon', 'armor', 'head'].includes(position)))).toBe(true)
  })
})
