import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { COMBAT_LOCATION_ORDER, COMBAT_LOCATIONS, getCombatZonesForTier, getDungeonForTier, getHuntingGroundForTier, getLocationsForTier, isCombatLocationUnlocked } from './worldNavigation'
import { COMBAT_LOCATION_IDS } from './combatLocationIds'
import { MONSTERS, MONSTER_IDS, validateMonsterDefinitions, isBossMonster } from '../monsters'
import { getProgressionElementCounts } from './combatProgression'
import { HUNTER_STANDINGS } from '../hunters-order/hunterRanks'
import { validateCombatWorldNavigation } from './worldNavigationValidation'
import { validateGameContent } from '../validateGameContent'
import { SCALDING_RIFT_ROSTER } from '../monsters/elite-zones/scaldingRift'

describe('global Combat location progression', () => {
  it('authors 33 locations in one unique global progression order', () => {
    expect(COMBAT_LOCATION_ORDER).toHaveLength(33)
    expect(COMBAT_LOCATION_IDS).toHaveLength(33)
    expect(COMBAT_LOCATION_ORDER.map((id) => COMBAT_LOCATIONS[id].progressionOrder)).toEqual(Array.from({ length: 33 }, (_, index) => index + 1))
    expect(new Set(COMBAT_LOCATION_ORDER).size).toBe(33)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.progression?.locationType === 'combat-zone')).toHaveLength(20)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.progression?.locationType === 'hunting-ground')).toHaveLength(5)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.progression?.locationType === 'dungeon')).toHaveLength(5)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.progression?.locationType === 'special')).toHaveLength(3)
    const runtimeNormals = COMBAT_LOCATION_ORDER.flatMap((id) => COMBAT_LOCATIONS[id].monsterPool)
    expect(runtimeNormals).toHaveLength(190)
    expect(new Set(runtimeNormals).size).toBe(runtimeNormals.length)
    expect(Object.values(COMBAT_LOCATIONS).every((location) => !('regionId' in location))).toBe(true)
  })

  it('accounts for all 33 stable IDs in the T1-T5 progression model', () => {
    expect(new Set(COMBAT_LOCATION_ORDER).size).toBe(33)
    expect(COMBAT_LOCATION_ORDER.every((id) => Boolean(COMBAT_LOCATIONS[id].progression))).toBe(true)
    expect(COMBAT_LOCATION_ORDER.filter((id) => COMBAT_LOCATIONS[id].progression?.locationType === 'special')).toEqual(['howling-den', 'scalding-rift', 'nullstone-archive'])
    for (const tier of [1, 2, 3, 4, 5] as const) {
      expect(getCombatZonesForTier(tier)).toHaveLength(4)
      expect(getCombatZonesForTier(tier).map((location) => location.progression?.element).sort()).toEqual(['air', 'earth', 'fire', 'water'])
      for (const zone of getCombatZonesForTier(tier)) {
        const counts = getProgressionElementCounts(zone)
        const laneElement = zone.progression!.element as keyof typeof counts
        const laneShare = counts[laneElement] / zone.monsterPool.length
        expect(zone.monsterPool.length, zone.id).toBeGreaterThanOrEqual(tier === 1 ? 4 : 5)
        if (tier > 1) expect(zone.monsterPool.length, zone.id).toBeLessThanOrEqual(8)
        expect(laneShare, `${zone.name}: ${counts[laneElement]}/${zone.monsterPool.length} ${laneElement}`).toBeGreaterThanOrEqual(tier === 1 ? 1 : 0.6)
        expect(zone.bossId, `${zone.name} boss`).toBeTruthy()
        expect(MONSTERS[zone.bossId!]!.primaryAffinity, `${zone.name} boss affinity`).toBe(laneElement)
      }
      expect(getDungeonForTier(tier)?.progression).toMatchObject({ tier, locationType: 'dungeon' })
      const ground = getHuntingGroundForTier(tier)
      expect(ground).toMatchObject({ progression: { tier, locationType: 'hunting-ground' }, bossId: null })
      expect(ground!.monsterPool.length).toBeGreaterThan(0)
      const standing = HUNTER_STANDINGS.find((rank) => rank.id === ground!.progression?.requiredHunterOrderRank)
      expect(standing).toBeTruthy()
      expect(getProgressionElementCounts(ground!).fire + getProgressionElementCounts(ground!).earth + getProgressionElementCounts(ground!).air + getProgressionElementCounts(ground!).water + getProgressionElementCounts(ground!).arcane).toBe(ground!.monsterPool.length)
      expect(getLocationsForTier(tier).every((location) => location.progression?.tier === tier)).toBe(true)
    }
    expect([1, 2, 3, 4, 5].map((tier) => getHuntingGroundForTier(tier as 1 | 2 | 3 | 4 | 5)?.id)).toEqual(['hunters-ground', 'mistclaw-highlands', 'cinderhex-barrens', 'cinder-sepulcher', 'temple-of-the-sunken-bell'])
  })

  it('preserves four opening elemental zones and each authored location type', () => {
    expect(COMBAT_LOCATIONS['stonewake-hollow'].primaryElement).toBe('earth')
    expect(COMBAT_LOCATIONS['galecrest-heights'].primaryElement).toBe('air')
    expect(COMBAT_LOCATIONS['tideglass-caverns'].primaryElement).toBe('water')
    expect(COMBAT_LOCATIONS['emberfall-basin'].primaryElement).toBe('fire')
    expect(validateCombatWorldNavigation({ locations: COMBAT_LOCATIONS })).toEqual([])
  })

  it('uses Stormspire as the T5 Air lane and Scalding Rift as a gated Special', () => {
    expect(COMBAT_LOCATIONS['stormspire-monastery']).toMatchObject({
      type: 'combat-zone', encounterMode: 'targeted', sequence: null, bossId: 'abbot-ninth-gale',
      progression: { tier: 5, locationType: 'combat-zone', element: 'air', requiredTier: 5, requiredDungeonClear: 'broken-meridian' },
    })
    expect(COMBAT_LOCATIONS['stormspire-monastery'].monsterPool).toEqual(expect.arrayContaining([
      'zephyr-disciple', 'skychain-sentinel', 'smokeveil-assassin', 'stormcurrent-hunter', 'stonebell-keeper',
    ]))
    expect(COMBAT_LOCATIONS['stormspire-monastery'].monsterPool).toHaveLength(5)
    expect(COMBAT_LOCATIONS['scalding-rift']).toMatchObject({
      type: 'elite-zone', encounterMode: 'targeted', zoneAffixId: 'frenzied', bossId: 'steam-tyrant',
      progression: { tier: 5, locationType: 'special', element: 'mixed', requiredTier: 5, requiredDungeonClear: 'broken-meridian' },
    })
    expect(COMBAT_LOCATIONS['scalding-rift'].monsterPool).toEqual(SCALDING_RIFT_ROSTER)
    expect(COMBAT_LOCATIONS['nullstone-archive'].progression).toMatchObject({ tier: 5, locationType: 'special', requiredTier: 5 })
    expect(COMBAT_LOCATIONS['nullstone-archive'].monsterPool).toEqual(expect.arrayContaining(['null-scribe', 'starbound-eye', 'astral-husk']))
  })

  it('has exactly 220 monsters, 190 normal enemies, and 30 bosses', () => {
    expect(MONSTER_IDS).toHaveLength(220)
    expect(MONSTER_IDS.filter((id) => isBossMonster(MONSTERS[id]))).toHaveLength(30)
    expect(MONSTER_IDS.filter((id) => !isBossMonster(MONSTERS[id]))).toHaveLength(190)
    const totals = Object.fromEntries(['earth', 'arcane', 'air', 'fire', 'water'].map((element) => [element, MONSTER_IDS.filter((id) => MONSTERS[id].primaryAffinity === element).length]))
    expect(totals).toEqual({ earth: 44, arcane: 41, air: 45, fire: 45, water: 45 })
    expect(validateMonsterDefinitions()).toEqual([])
    expect(validateGameContent()).toEqual([])
  })

  it('uses dungeon clears as outer tier gates while retaining authored local prerequisites', () => {
    const state = createInitialState()
    const tiers = [1, 2, 3, 4, 5] as const
    expect(tiers.slice(1).every((tier) => !isCombatLocationUnlocked(getCombatZonesForTier(tier)[0]!.id, state.progress))).toBe(true)
    for (const tier of tiers.slice(1)) {
      const previousDungeon = getDungeonForTier((tier - 1) as 1 | 2 | 3 | 4)!
      state.progress.bossKillsByBoss[previousDungeon.bossId!] = 1
      expect(getCombatZonesForTier(tier).every((zone) => isCombatLocationUnlocked(zone.id, state.progress))).toBe(true)
      const ground = getHuntingGroundForTier(tier)!
      if (tier === 1) {
        expect(isCombatLocationUnlocked(ground.id, state.progress)).toBe(true)
        continue
      }
      const requiredStanding = HUNTER_STANDINGS.find((rank) => rank.id === ground.progression?.requiredHunterOrderRank)!
      state.progress.huntersOrder = { ...state.progress.huntersOrder!, reputation: requiredStanding.reputation - 1 }
      expect(isCombatLocationUnlocked(ground.id, state.progress)).toBe(false)
      state.progress.huntersOrder = { ...state.progress.huntersOrder!, reputation: requiredStanding.reputation }
      expect(isCombatLocationUnlocked(ground.id, state.progress)).toBe(true)
    }
  })

  it('requires the T5 Dungeon gate before exposing T5 Specials', () => {
    const state = createInitialState()
    Object.assign(state.progress.bossKillsByBoss, {
      'pyrehold-castellan': 1, 'drowned-regent': 1, 'steam-tyrant': 1, 'unmade-magister': 1,
    })
    expect(COMBAT_LOCATIONS['howling-den'].progression?.requiredTier).toBeUndefined()
    expect(isCombatLocationUnlocked('stormspire-monastery', state.progress)).toBe(false)
    expect(isCombatLocationUnlocked('scalding-rift', state.progress)).toBe(false)
    expect(isCombatLocationUnlocked('nullstone-archive', state.progress)).toBe(false)
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    expect(isCombatLocationUnlocked('stormspire-monastery', state.progress)).toBe(true)
    expect(isCombatLocationUnlocked('scalding-rift', state.progress)).toBe(true)
    expect(isCombatLocationUnlocked('nullstone-archive', state.progress)).toBe(true)
  })
})
