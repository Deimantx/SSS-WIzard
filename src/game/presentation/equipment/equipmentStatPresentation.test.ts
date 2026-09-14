import { describe, expect, it } from 'vitest'
import { formatEquipmentStat } from './equipmentStatPresentation'

describe('Equipment stat presentation', () => {
  it('rounds Mana Regen up for display', () => {
    expect(formatEquipmentStat('manaRegen', 29.50000000000004, false)).toBe('30/s')
  })
})
