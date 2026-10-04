import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { COMBAT_LOCATION_ORDER, COMBAT_LOCATIONS, getCombatZonesForTier, getDungeonForTier, getHuntingGroundForTier, getLocationsForTier, isCombatLocationUnlocked } from './worldNavigation'
import { COMBAT_LOCATION_IDS } from './combatLocationIds'
import { MONSTERS, MONSTER_IDS, validateMonsterDefinitions, isBossMonster } from '../monsters'
import { getProgressionElementCounts } from './combatProgression'
import { HUNTER_STANDINGS } from '../hunters-order/hunterRanks'
import { validateCombatWorldNavigation } from './worldNavigationValidation'
import { validateGameContent } from '../validateGameContent'

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
    expect(COMBAT_LOCATION_ORDER.filter((id) => COMBAT_LOCATIONS[id].progression?.locationType === 'special')).toEqual(['howling-den', 'stormspire-monastery', 'nullstone-archive'])
    for (const tier of [1, 2, 3, 4, 5] as const) {
      expect(getCombatZonesForTier(tier)).toHaveLength(4)
      expect(getCombatZonesForTier(tier).map((location) => location.progression?.element).sort()).toEqual(['air', 'earth', 'fire', 'water'])
      for (const zone of getCombatZonesForTier(tier)) {
        const counts = getProgressionElementCounts(zone)
        const laneElement = zone.progression!.element as keyof typeof counts
        const authoredLaneMinimum = tier === 1 ? zone.monsterPool.length : ['vault-of-the-black-sigil', 'scalding-rift'].includes(zone.id) ? 1 : 5
        expect(counts[laneElement], zone.id).toBeGreaterThanOrEqual(authoredLaneMinimum)
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

  it('has exactly 220 monsters, 190 normal enemies, and 30 bosses', () => {
    expect(MONSTER_IDS).toHaveLength(220)
    expect(MONSTER_IDS.filter((id) => isBossMonster(MONSTERS[id]))).toHaveLength(30)
    expect(MONSTER_IDS.filter((id) => !isBossMonster(MONSTERS[id]))).toHaveLength(190)
    const totals = Object.fromEntries(['earth', 'arcane', 'air', 'fire', 'water'].map((element) => [element, MONSTER_IDS.filter((id) => MONSTERS[id].primaryAffinity === element).length]))
    expect(totals).toEqual({ earth: 44, arcane: 44, air: 44, fire: 44, water: 44 })
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
})
