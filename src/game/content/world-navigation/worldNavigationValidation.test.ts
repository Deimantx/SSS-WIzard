import { describe, expect, it } from 'vitest'
import { DUNGEON_ORDER, DUNGEONS } from '../dungeons/dungeons'
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
    expect(COMBAT_CONTINENTS['continent-1'].regionIds).toEqual(['first-frontier', 'elemental-scar', 'shattered-meridian', 'black-sigil-reach'])
    expect(COMBAT_REGIONS['first-frontier'].continentId).toBe('continent-1')
    expect(COMBAT_REGIONS['first-frontier'].locationIds).toEqual(['whispering-woods', 'howling-den', 'abandoned-catacombs'])
    expect(COMBAT_LOCATIONS['whispering-woods']).toMatchObject({ regionId: 'first-frontier', type: 'combat-zone', dungeonId: 'whispering-woods' })
    expect(COMBAT_LOCATIONS['howling-den']).toMatchObject({ encounterMode: 'targeted', type: 'elite-zone', dungeonId: 'howling-den', zoneAffixId: 'frenzied' })
    expect(Object.entries(COMBAT_LOCATIONS['howling-den'].targetMetadata ?? {}).map(([monsterId, metadata]) => [monsterId, metadata.difficulty, metadata.order])).toEqual([
      ['cavefang-wolf', 'standard', 1],
      ['razorclaw-lynx', 'standard', 2],
      ['corrupted-dire-wolf', 'hard', 3],
      ['bonehide-boar', 'hard', 4],
      ['moonblind-jackal', 'hard', 5],
      ['den-stalker', 'apex', 6],
    ])
    expect(COMBAT_LOCATIONS['abandoned-catacombs']).toMatchObject({ encounterMode: 'sequence', dungeonId: 'abandoned-catacombs', firstClearUnlockPreview: [
      { id: 'black-portal-shard', label: 'Black Portal Shard' },
      { id: 'dark-portal', label: 'Dark Portal' },
      { id: 'world-tier-2', label: 'World Tier 2' },
      { id: 'elemental-scar', label: 'Elemental Scar' },
      { id: 'magic-school-cap', label: 'Magic School Cap Increase' },
    ] })
    expect(COMBAT_REGIONS['elemental-scar'].locationIds).toEqual(['fractured-approach', 'flooded-reliquary', 'ashen-watch', 'rootscar-hollow', 'crossroads-of-ruin'])
    expect(COMBAT_LOCATIONS['fractured-approach']).toMatchObject({ encounterMode: 'sequence', firstClearUnlockPreview: [
      { id: 'summoning', label: 'Summoning' },
      { id: 'flooded-reliquary', label: 'Flooded Reliquary' },
      { id: 'ashen-watch', label: 'Ashen Watch' },
      { id: 'rootscar-hollow', label: 'Rootscar Hollow' },
    ] })
    expect(COMBAT_LOCATIONS['crossroads-of-ruin']).toMatchObject({ encounterMode: 'sequence', firstClearUnlockPreview: [
      { id: 'shattered-meridian', label: 'Shattered Meridian' },
      { id: 'world-tier-3', label: 'World Tier 3' },
    ] })
    expect(COMBAT_LOCATIONS['graveglass-hollow']).toMatchObject({ encounterMode: 'targeted', type: 'elite-zone', zoneAffixId: 'warded' })
    expect(COMBAT_LOCATIONS['stormvault-gallery']).toMatchObject({ encounterMode: 'targeted', type: 'combat-zone' })
    expect(COMBAT_LOCATIONS['stormvault-gallery'].zoneAffixId).toBeUndefined()
    expect(COMBAT_LOCATIONS['starfallen-observatory']).toMatchObject({ encounterMode: 'targeted', type: 'elite-zone', zoneAffixId: 'relentless' })
    for (const locationId of ['graveglass-hollow', 'stormvault-gallery', 'starfallen-observatory'] as const) {
      const location = COMBAT_LOCATIONS[locationId]
      expect(Object.values(location.targetMetadata ?? {}).map((metadata) => metadata.order)).toEqual([1, 2, 3, 4, 5, 6, 7])
      expect(DUNGEONS[locationId].threatRequired).toBe(30000)
    }
    expect(COMBAT_LOCATIONS['broken-meridian']).toMatchObject({ encounterMode: 'sequence', firstClearUnlockPreview: [
      { id: 'black-sigil-reach', label: 'Black Sigil Reach' },
      { id: 'world-tier-4', label: 'World Tier 4' },
      { id: 'act1-artifact-levels-8-10', label: 'Act 1 Artifact Levels 8-10' },
    ] })
    for (const locationId of ['flooded-reliquary', 'ashen-watch', 'rootscar-hollow'] as const) {
      const location = COMBAT_LOCATIONS[locationId]
      expect(location).toMatchObject({ encounterMode: 'targeted', type: 'combat-zone' })
      expect(location.zoneAffixId).toBeUndefined()
      expect(Object.keys(location.targetMetadata ?? {})).toHaveLength(7)
      expect(Object.values(location.targetMetadata ?? {}).map((metadata) => metadata.order)).toEqual([1, 2, 3, 4, 5, 6, 7])
    }
    expect(COMBAT_REGIONS['shattered-meridian'].locationIds).toEqual(['graveglass-hollow', 'stormvault-gallery', 'starfallen-observatory', 'broken-meridian'])
    expect(COMBAT_REGIONS['black-sigil-reach'].locationIds).toEqual(['hall-of-unbound-names', 'vault-of-the-black-sigil', 'black-gate'])
    expect(Object.values(COMBAT_LOCATIONS)).toHaveLength(15)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.type === 'combat-zone')).toHaveLength(5)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.type === 'elite-zone')).toHaveLength(5)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.type === 'dungeon')).toHaveLength(5)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.type === 'special-zone' || location.type === 'tower')).toHaveLength(0)
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

  it('requires Zone Affix only for targeted Elite Zones', () => {
    const missingAffix = validContent()
    missingAffix.locations['howling-den'] = { ...missingAffix.locations['howling-den'], zoneAffixId: undefined }
    expect(validateCombatWorldNavigation(missingAffix)).toContain('howling-den: targeted elite zone requires one valid Zone Affix')

    const invalidNonElite = validContent()
    invalidNonElite.locations['whispering-woods'] = { ...invalidNonElite.locations['whispering-woods'], zoneAffixId: 'frenzied' }
    expect(validateCombatWorldNavigation(invalidNonElite)).toContain('whispering-woods: Zone Affix is only valid on targeted Elite Zones')
  })
})
