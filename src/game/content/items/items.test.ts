import { describe, expect, it } from 'vitest'
import { MATERIAL_ITEMS } from './materials'
import { ARTIFACT_ITEMS } from './artifactItems'
import { ITEMS, validateItemDefinitions } from './items'
import { mergeItemRegistries } from './itemAuthoring'
import { SPECIAL_ITEMS } from './specialItems'
import { material } from './itemAuthoring'
import { MATERIAL_SUBCATEGORIES, MATERIAL_SUBTYPE_LABELS } from './inventoryMetadata'

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
    expect(() => mergeItemRegistries(SPECIAL_ITEMS, SPECIAL_ITEMS)).toThrow('Duplicate authored ItemId')
  })

  it('keeps material, special, and Artifact ownership IDs unique', () => {
    const authoredIds = [...Object.keys(SPECIAL_ITEMS), ...Object.keys(MATERIAL_ITEMS), ...Object.keys(ARTIFACT_ITEMS)]
    expect(new Set(authoredIds).size).toBe(authoredIds.length)
    expect(ARTIFACT_ITEMS['ember-staff']).toBeDefined()
    expect(ARTIFACT_ITEMS['galeshard-staff']).toBeDefined()
  })

  it('validates all canonical item definitions', () => {
    expect(validateItemDefinitions()).toEqual([])
  })

  it('preserves Herb as an authored material subtype and inventory filter label', () => {
    const herb = material('fire-fragment', 'Test Herb', 'Test material', 'leaf', '#fff', 'monster-loot', 'Test', 'herb')
    expect(herb.materialSubtype).toBe('herb')
    expect(MATERIAL_SUBTYPE_LABELS.herb).toBe('Herb')
    expect(MATERIAL_SUBCATEGORIES).toContain('Herb')
    expect(herb.materialSubtype).not.toBe('creature')
  })
})
