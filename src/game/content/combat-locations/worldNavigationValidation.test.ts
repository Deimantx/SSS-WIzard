import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { COMBAT_LOCATION_ORDER, COMBAT_LOCATIONS, getCombatZonesForTier, getDungeonForTier, getHuntingGroundForTier, getLocationsForTier, isCombatLocationUnlocked } from './worldNavigation'
import { COMBAT_LOCATION_IDS } from './combatLocationIds'
import { MONSTERS, MONSTER_IDS, validateMonsterDefinitions, isBossMonster } from '../monsters'
import { validateCombatWorldNavigation } from './worldNavigationValidation'
import { validateGameContent } from '../validateGameContent'

describe('global Combat location progression', () => {
  it('authors 33 locations in one unique global progression order', () => {
    expect(COMBAT_LOCATION_ORDER).toHaveLength(33)
    expect(COMBAT_LOCATION_IDS).toHaveLength(33)
    expect(COMBAT_LOCATION_ORDER.map((id) => COMBAT_LOCATIONS[id].progressionOrder)).toEqual(Array.from({ length: 33 }, (_, index) => index + 1))
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.type === 'combat-zone')).toHaveLength(13)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.type === 'elite-zone')).toHaveLength(8)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.type === 'hunting-ground')).toHaveLength(3)
    expect(Object.values(COMBAT_LOCATIONS).filter((location) => location.type === 'dungeon')).toHaveLength(9)
    expect(Object.values(COMBAT_LOCATIONS).every((location) => !('regionId' in location))).toBe(true)
  })

  it('accounts for all 33 stable IDs in the T1-T5 progression model', () => {
    expect(new Set(COMBAT_LOCATION_ORDER).size).toBe(33)
    expect(COMBAT_LOCATION_ORDER.every((id) => Boolean(COMBAT_LOCATIONS[id].progression))).toBe(true)
    expect(COMBAT_LOCATION_ORDER.filter((id) => COMBAT_LOCATIONS[id].progression?.locationType === 'special')).toEqual([
      'howling-den', 'cinder-sepulcher', 'temple-of-the-sunken-bell', 'stormspire-monastery', 'nullstone-archive',
    ])
    expect([1, 2, 3, 4, 5].map((tier) => getCombatZonesForTier(tier as 1 | 2 | 3 | 4 | 5))).toHaveLength(5)
    for (const tier of [1, 2, 3, 4, 5] as const) {
      expect(getCombatZonesForTier(tier)).toHaveLength(4)
      expect(getDungeonForTier(tier)?.progression).toMatchObject({ tier, locationType: 'dungeon' })
      expect(getLocationsForTier(tier).every((location) => location.progression?.tier === tier)).toBe(true)
    }
    expect([1, 2, 3].map((tier) => getHuntingGroundForTier(tier as 1 | 2 | 3 | 4 | 5)?.id)).toEqual(['hunters-ground', 'mistclaw-highlands', 'cinderhex-barrens'])
    expect(getHuntingGroundForTier(4)).toBeNull()
    expect(getHuntingGroundForTier(5)).toBeNull()
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

  it('unlocks expansion branches from their specified existing or new boss anchors', () => {
    const state = createInitialState()
    expect(isCombatLocationUnlocked('brineveil-marsh', state.progress)).toBe(false)
    state.progress.bossKillsByBoss['forest-heart'] = 1
    expect(isCombatLocationUnlocked('brineveil-marsh', state.progress)).toBe(true)
    state.progress.bossKillsByBoss['pyrehold-castellan'] = 1
    expect(isCombatLocationUnlocked('scalding-rift', state.progress)).toBe(false)
    state.progress.bossKillsByBoss['drowned-regent'] = 1
    expect(isCombatLocationUnlocked('scalding-rift', state.progress)).toBe(true)
  })
})
