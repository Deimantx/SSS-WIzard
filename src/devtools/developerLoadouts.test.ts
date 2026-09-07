import { describe, expect, it } from 'vitest'
import { ITEMS } from '../game/content/items/items'
import { isPositionCompatible } from '../game/core/equipment/equipmentRules'
import { DEVELOPER_LOADOUTS } from './developerLoadouts'
import type { EquipmentPosition } from '../game/types'

describe('developer equipment loadouts', () => {
  it('references existing Equipment in compatible positions and assigns each tutorial Earring', () => {
    DEVELOPER_LOADOUTS.forEach((loadout) => Object.entries(loadout.slots).forEach(([position, itemId]) => {
      if (!itemId) return
      expect(ITEMS[itemId]).toBeDefined()
      expect(isPositionCompatible(itemId, position as EquipmentPosition)).toBe(true)
    }))

    expect(DEVELOPER_LOADOUTS.map((loadout) => loadout.slots.earring)).toEqual([
      'wispglass-earring',
      'wispglass-earring',
      'fangwire-earring',
      'fangwire-earring',
      'mourning-glass-earring',
      'mourning-glass-earring',
    ])
  })
})
