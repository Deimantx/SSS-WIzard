import { describe, expect, it } from 'vitest'
import { ACT0_ITEMS } from './act0'
import { ACT1_ITEMS } from './act1'
import { ITEMS, validateItemDefinitions } from './items'
import { mergeItemRegistries } from './shared/itemAuthoring'
import { SHARED_ITEMS } from './shared/universalItems'

describe('items content architecture', () => {
  it('keeps only materials and permanent Artifact Equipment in the runtime registry', () => {
    expect(Object.keys(ITEMS)).toEqual(expect.arrayContaining([
      'fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment', 'prismatic-fragment', 'artifact-essence', 'life-essence',
      'ember-staff', 'tideglass-wand', 'stoneheart-scepter', 'windthread-wand', 'wispweave-robe', 'wispveil-hood',
      'galeshard-staff', 'reliquary-scepter', 'pyrebound-staff', 'rootheart-scepter', 'convergence-robe', 'waystone-circlet',
      'black-portal-shard',
    ]))
    expect(Object.values(ITEMS).filter((item) => item.kind === 'equipment').every((item) => ['weapon', 'armor', 'helmet'].includes(item.equipmentSlot ?? ''))).toBe(true)
    expect(Object.values(ITEMS).filter((item) => item.kind === 'equipment')).toHaveLength(12)
  })

  it('rejects duplicate authored IDs during registry merge', () => {
    expect(() => mergeItemRegistries(SHARED_ITEMS, SHARED_ITEMS)).toThrow('Duplicate authored ItemId')
  })

  it('keeps shared, Act 0, and Act 1 ownership IDs unique', () => {
    const authoredIds = [...Object.keys(SHARED_ITEMS), ...Object.keys(ACT0_ITEMS), ...Object.keys(ACT1_ITEMS)]
    expect(new Set(authoredIds).size).toBe(authoredIds.length)
    expect(ACT0_ITEMS['ember-staff']).toBeDefined()
    expect(ACT1_ITEMS['galeshard-staff']).toBeDefined()
    expect(ACT0_ITEMS['galeshard-staff']).toBeUndefined()
  })

  it('validates all canonical item definitions', () => {
    expect(validateItemDefinitions()).toEqual([])
  })
})
