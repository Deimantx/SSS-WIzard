import { describe, expect, it } from 'vitest'
import { validateGameContent } from './validateGameContent'
import { ITEMS, validateItemDefinitions } from './items/items'

describe('game content validation bootstrap', () => {
  it('validates production combat content without errors', () => {
    expect(validateGameContent()).toEqual([])
  })

  it('requires positive material tiers and rejects equipment tiers', () => {
    expect(Object.values(ITEMS).filter((item) => item.kind === 'material').every((item) => item.materialTier === 1)).toBe(true)
    const invalidMaterial = { ...ITEMS['fire-fragment'], materialTier: 0 }
    const invalidEquipment = { ...ITEMS['ember-staff'], materialTier: 1 }
    expect(validateItemDefinitions({ ...ITEMS, 'fire-fragment': invalidMaterial, 'ember-staff': invalidEquipment })).toEqual(expect.arrayContaining([
      'fire-fragment: materialTier must be a positive integer',
      'ember-staff: equipment must not define materialTier',
    ]))
  })
})
