import { describe, expect, it } from 'vitest'
import { DUNGEON_ORDER } from '../dungeons/dungeons'
import { COMBAT_CONTINENTS, COMBAT_LOCATIONS, COMBAT_REGIONS } from './worldNavigation'
import { validateCombatWorldNavigation, type CombatWorldNavigationContent } from './worldNavigationValidation'

const validContent = (): CombatWorldNavigationContent => ({
  continents: { ...COMBAT_CONTINENTS },
  regions: { ...COMBAT_REGIONS },
  locations: { ...COMBAT_LOCATIONS },
})

describe('combat world navigation content', () => {
  it('validates the authored registry and preserves every gameplay dungeon', () => {
    expect(validateCombatWorldNavigation(validContent())).toEqual([])
    expect(new Set(Object.values(COMBAT_LOCATIONS).filter((location) => location.dungeonId).map((location) => location.dungeonId))).toEqual(new Set(DUNGEON_ORDER))
  })

  it('keeps continent, region, and location relationships explicit', () => {
    expect(COMBAT_CONTINENTS['continent-1'].regionIds).toEqual(['first-frontier', 'shattered-frontier'])
    expect(COMBAT_REGIONS['first-frontier'].continentId).toBe('continent-1')
    expect(COMBAT_REGIONS['first-frontier'].locationIds).toEqual(['whispering-woods', 'howling-den', 'abandoned-catacombs'])
    expect(COMBAT_LOCATIONS['whispering-woods']).toMatchObject({ regionId: 'first-frontier', type: 'combat-zone', dungeonId: 'whispering-woods' })
  })

  it('reports broken parent links, duplicate mappings, and invalid orders', () => {
    const content = validContent()
    content.continents['duplicate'] = { ...content.continents['continent-1'], id: 'continent-1', order: 0 }
    content.regions['orphan'] = { id: 'orphan', continentId: 'missing', name: 'Orphan', locationIds: ['missing-location'], order: 1 }
    content.locations['duplicate-location'] = { ...content.locations['whispering-woods'], id: 'duplicate-location', regionId: 'first-frontier', order: 1 }

    const errors = validateCombatWorldNavigation(content)
    expect(errors).toEqual(expect.arrayContaining([
      'continents: orders must be positive integers',
      'orphan: references missing continent missing',
      'orphan: must be listed by exactly one continent',
      'orphan: references missing location missing-location',
      'duplicate-location: dungeon whispering-woods is already mapped by whispering-woods',
    ]))
  })
})
