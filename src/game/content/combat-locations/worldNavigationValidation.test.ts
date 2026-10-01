import { describe, expect, it } from 'vitest'
import { DUNGEON_ORDER, DUNGEONS, isDungeonUnlocked } from '../combat-locations/dungeons/dungeons'
import { createInitialState } from '../../../store/initialState'
import { COMBAT_LOCATIONS, COMBAT_REGIONS, isCombatLocationUnlocked } from './worldNavigation'
import { COMBAT_LOCATION_TYPE_METADATA } from './worldNavigationTypes'
import { MONSTERS } from '../monsters'
import { ELEMENTAL_TUTORIAL_ZONE_ROSTERS } from '../monsters/elementalTutorial'
import { resolveEnemyPowerRating } from '../../presentation/combat/enemyPowerRating'
import { validateCombatWorldNavigation, type CombatWorldNavigationContent } from './worldNavigationValidation'
import { getElementMultiplier } from '../elements/elements'
import { COMBAT_LOCATION_IDS, COMBAT_REGION_IDS, isCombatLocationId } from './combatLocationIds'

const validContent = (): CombatWorldNavigationContent => ({
  regions: { ...COMBAT_REGIONS },
  locations: { ...COMBAT_LOCATIONS },
})

describe('combat world navigation content', () => {
  it('keeps the closed location and region ID sets aligned with their registries', () => {
    expect(Object.keys(COMBAT_LOCATIONS).sort()).toEqual([...COMBAT_LOCATION_IDS].sort())
    expect(Object.keys(COMBAT_REGIONS).sort()).toEqual([...COMBAT_REGION_IDS].sort())
    expect(COMBAT_LOCATION_IDS.every((locationId) => COMBAT_REGIONS[COMBAT_LOCATIONS[locationId].regionId].locationIds.includes(locationId))).toBe(true)
    expect(isCombatLocationId('broken-meridian')).toBe(true)
    expect(isCombatLocationId('not-a-location')).toBe(false)
  })

  it('authors four pure elemental tutorial zones with five correctly powered encounters each', () => {
    const expected = { 'stonewake-hollow': 'earth', 'galecrest-heights': 'air', 'tideglass-caverns': 'water', 'emberfall-basin': 'fire' } as const
    for (const [locationId, element] of Object.entries(expected) as Array<[keyof typeof expected, (typeof expected)[keyof typeof expected]]>) {
      const roster = ELEMENTAL_TUTORIAL_ZONE_ROSTERS[locationId]
      expect(roster.element).toBe(element)
      const location = COMBAT_LOCATIONS[locationId]
      expect(location.primaryElement).toBe(element)
      const ids = [...roster.normalEnemyIds, roster.bossId]
      expect(ids).toHaveLength(5)
      ids.forEach((id, index) => {
        const monster = MONSTERS[id]
        expect(monster.primaryAffinity).toBe(element)
        expect(monster.basicAttackElement).toBe(element)
        expect(monster.resonanceYield).toEqual({ [element]: expect.any(Number) })
        const powerBand = [[95, 115], [125, 155], [170, 210], [230, 280], [400, 500]][index]
        expect(resolveEnemyPowerRating(id, 1)).toBeGreaterThanOrEqual(powerBand[0])
        expect(resolveEnemyPowerRating(id, 1)).toBeLessThanOrEqual(powerBand[1])
        for (const action of Object.values(monster.actions)) for (const effect of action.effects) if (effect.type === 'deal-damage') expect(effect.components.every((component) => component.damageType === element)).toBe(true)
      })
    }
  })
  it('preserves the intended strong and inverse resisted matchups against each tutorial boss', () => {
    const cases = [
      ['water', 'pyre-guardian', 'fire'],
      ['air', 'deepwater-oracle', 'water'],
      ['earth', 'tempest-roc', 'air'],
      ['fire', 'heartstone-colossus', 'earth'],
    ] as const
    for (const [attacking, bossId, defending] of cases) {
      expect(MONSTERS[bossId].primaryAffinity).toBe(defending)
      expect(getElementMultiplier(attacking, MONSTERS[bossId].primaryAffinity)).toBe(1.5)
      expect(getElementMultiplier(defending, attacking)).toBe(0.5)
    }
  })
  it('exposes roster-derived elements on canonical locations', () => {
    expect(Object.values(COMBAT_LOCATIONS).every((location) => Array.isArray(location.elementsPresent))).toBe(true)
    expect(COMBAT_LOCATIONS['ashen-watch'].elementsPresent).toContain('fire')
    Object.values(COMBAT_LOCATIONS).forEach((location) => {
      if (location.primaryElement) expect(location.elementsPresent).toEqual([location.primaryElement])
    })
    for (const id of ['whispering-woods', 'howling-den', 'hunters-ground', 'abandoned-catacombs'] as const) expect(COMBAT_LOCATIONS[id].primaryElement).toBeUndefined()
  })

  it('gates First Frontier locations through historical boss evidence', () => {
    const state = createInitialState()
    expect(isCombatLocationUnlocked('whispering-woods', state.progress)).toBe(false)
    state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true
    expect(isCombatLocationUnlocked('whispering-woods', state.progress)).toBe(true)
    expect(isCombatLocationUnlocked('howling-den', state.progress)).toBe(false)
    state.progress.bossKillsByBoss['forest-heart'] = 1
    expect(isCombatLocationUnlocked('howling-den', state.progress)).toBe(true)
    expect(isCombatLocationUnlocked('hunters-ground', state.progress)).toBe(false)
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    expect(isCombatLocationUnlocked('hunters-ground', state.progress)).toBe(true)
    expect(isCombatLocationUnlocked('abandoned-catacombs', state.progress)).toBe(true)
  })

  it('defines Hunting Ground as an explicit location type', () => {
    expect(COMBAT_LOCATION_TYPE_METADATA['hunting-ground']).toEqual({ label: 'HUNTING GROUND', actionLabel: 'ENTER HUNTING GROUND' })
    expect(COMBAT_LOCATIONS['hunters-ground']).toMatchObject({ id: 'hunters-ground', name: 'Gloamridge', type: 'hunting-ground', encounterMode: 'targeted' })
  })
  it('validates the authored registry and preserves every gameplay dungeon', () => {
    expect(validateCombatWorldNavigation(validContent())).toEqual([])
    expect(new Set(Object.values(COMBAT_LOCATIONS).filter((location) => location.id).map((location) => location.id))).toEqual(new Set(DUNGEON_ORDER))
  })

  it('keeps internal region and location progression order explicit', () => {
    expect(COMBAT_REGIONS['first-frontier'].locationIds).toEqual(['stonewake-hollow', 'galecrest-heights', 'tideglass-caverns', 'emberfall-basin', 'whispering-woods', 'howling-den', 'hunters-ground', 'abandoned-catacombs'])
    expect(COMBAT_LOCATIONS['whispering-woods']).toMatchObject({ regionId: 'first-frontier', type: 'combat-zone', id: 'whispering-woods' })
    expect(COMBAT_LOCATIONS['howling-den']).toMatchObject({ encounterMode: 'targeted', type: 'elite-zone', id: 'howling-den', zoneAffixId: 'frenzied' })
    expect(Object.entries(COMBAT_LOCATIONS['howling-den'].targetMetadata ?? {}).map(([monsterId, metadata]) => [monsterId, metadata.difficulty, metadata.order])).toEqual([
      ['cavefang-wolf', 'standard', 1],
      ['razorclaw-lynx', 'standard', 2],
      ['corrupted-dire-wolf', 'hard', 3],
      ['bonehide-boar', 'hard', 4],
      ['moonblind-jackal', 'hard', 5],
      ['den-stalker', 'apex', 6],
    ])
    expect(COMBAT_LOCATIONS['hunters-ground']).toMatchObject({ regionId: 'first-frontier', type: 'hunting-ground', id: 'hunters-ground', order: 7 })
    expect(COMBAT_LOCATIONS['abandoned-catacombs']).toMatchObject({ encounterMode: 'sequence', id: 'abandoned-catacombs', firstClearUnlockPreview: [
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
      { id: 'crystals', label: 'Crystals' },
    ] })
    expect(COMBAT_LOCATIONS['hall-of-unbound-names']).toMatchObject({ encounterMode: 'targeted', type: 'elite-zone', zoneAffixId: 'vicious' })
    expect(COMBAT_LOCATIONS['vault-of-the-black-sigil']).toMatchObject({ encounterMode: 'targeted', type: 'elite-zone', zoneAffixId: 'armored' })
    expect(COMBAT_LOCATIONS['black-gate']).toMatchObject({ encounterMode: 'sequence', type: 'dungeon', firstClearUnlockPreview: [{ id: 'world-tier-5', label: 'World Tier 5' }] })
    expect(Object.entries(COMBAT_LOCATIONS['hall-of-unbound-names'].targetMetadata ?? {}).map(([monsterId, metadata]) => [monsterId, metadata.difficulty, metadata.order])).toEqual([
      ['name-eater', 'standard', 1],
      ['bound-echo', 'standard', 2],
      ['hollow-liturgist', 'hard', 3],
      ['whisper-archivist', 'hard', 4],
      ['nameless-cantor', 'hard', 5],
      ['oathless-confessor', 'apex', 6],
      ['unwritten-hierophant', 'apex', 7],
    ])
    expect(Object.entries(COMBAT_LOCATIONS['vault-of-the-black-sigil'].targetMetadata ?? {}).map(([monsterId, metadata]) => [monsterId, metadata.difficulty, metadata.order])).toEqual([
      ['black-seal-parasite', 'standard', 1],
      ['inkbound-specter', 'standard', 2],
      ['sigil-guardian', 'hard', 3],
      ['vault-devourer', 'hard', 4],
      ['sealbound-custodian', 'hard', 5],
      ['blackscript-colossus', 'apex', 6],
      ['voidseal-arbiter', 'apex', 7],
    ])
    for (const locationId of ['hall-of-unbound-names', 'vault-of-the-black-sigil'] as const) {
      const location = COMBAT_LOCATIONS[locationId]
      expect(Object.keys(location.targetMetadata ?? {})).toHaveLength(7)
      expect(Object.keys(location.targetMetadata ?? {})).not.toContain(DUNGEONS[location.id!].boss)
      expect(DUNGEONS[location.id!].threatRequired).toBe(40000)
    }
    for (const locationId of ['flooded-reliquary', 'ashen-watch', 'rootscar-hollow'] as const) {
      const location = COMBAT_LOCATIONS[locationId]
      expect(location).toMatchObject({ encounterMode: 'targeted', type: 'combat-zone' })
      expect(location.zoneAffixId).toBeUndefined()
      expect(Object.keys(location.targetMetadata ?? {})).toHaveLength(7)
      expect(Object.values(location.targetMetadata ?? {}).map((metadata) => metadata.order)).toEqual([1, 2, 3, 4, 5, 6, 7])
    }
    expect(COMBAT_REGIONS['shattered-meridian'].locationIds).toEqual(['graveglass-hollow', 'stormvault-gallery', 'starfallen-observatory', 'broken-meridian'])
    expect(COMBAT_REGIONS['black-sigil-reach'].locationIds).toEqual(['hall-of-unbound-names', 'vault-of-the-black-sigil', 'black-gate'])
    expect(Object.values(COMBAT_LOCATIONS)).toHaveLength(20)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.type === 'combat-zone')).toHaveLength(9)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.type === 'hunting-ground')).toHaveLength(1)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.type === 'elite-zone')).toHaveLength(5)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.type === 'dungeon')).toHaveLength(5)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.type === 'special-zone' || location.type === 'tower')).toHaveLength(0)
  })

  it('reports broken parent links, duplicate mappings, and invalid orders', () => {
    const content = validContent()
    content.regions['orphan'] = { id: 'orphan', name: 'Orphan', locationIds: ['missing-location'], order: 1 } as never
    content.locations['duplicate-location'] = { ...content.locations['whispering-woods'], id: 'duplicate-location', regionId: 'first-frontier', order: 1 } as never

    const errors = validateCombatWorldNavigation(content)
    expect(errors).toEqual(expect.arrayContaining([
      'regions: sibling orders must be unique',
      'orphan: references missing location missing-location',
      'duplicate-location: references unknown location duplicate-location',
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

  it('keeps the Black Gate locked until both final Elite bosses are defeated', () => {
    const state = createInitialState()
    expect(isDungeonUnlocked(DUNGEONS['black-gate'], state.progress)).toBe(false)
    state.progress.bossKillsByBoss['unspoken-prelate'] = 1
    expect(isDungeonUnlocked(DUNGEONS['black-gate'], state.progress)).toBe(false)
    state.progress.bossKillsByBoss['sigil-warden'] = 1
    expect(isDungeonUnlocked(DUNGEONS['black-gate'], state.progress)).toBe(true)
  })
})
