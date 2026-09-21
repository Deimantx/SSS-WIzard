import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { buildCombatWorldNavigationViewModel, getInitialCombatLocationId } from './combatWorldNavigationReadModel'

describe('combat world navigation read model', () => {
  it('defaults to the active location, then the last entered location, then the first unlocked location', () => {
    const state = createInitialState()
    expect(getInitialCombatLocationId({ combat: state.combat, progress: state.progress })).toBe('whispering-woods')

    state.progress.bossKillsByBoss['forest-heart'] = 1
    expect(getInitialCombatLocationId({ combat: state.combat, lastEnteredDungeonId: 'howling-den', progress: state.progress })).toBe('howling-den')

    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    expect(getInitialCombatLocationId({ combat: state.combat, lastEnteredDungeonId: 'howling-den', progress: state.progress })).toBe('whispering-woods')
  })

  it('presents First Frontier with Combat Zones and Dungeons only', () => {
    const state = createInitialState()
    const view = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedLocationId: 'whispering-woods' })

    expect(view.selectedContinent.name).toBe('Continent I')
    expect(view.selectedRegion.name).toBe('First Frontier')
    expect(view.selectedRegion.groups.map((group) => group.label)).toEqual(['COMBAT ZONES', 'DUNGEONS'])
    expect(view.selectedRegion.groups[0].locations.map((location) => location.name)).toEqual(['Whispering Woods'])
    expect(view.selectedRegion.groups[1].locations.map((location) => location.name)).toEqual(['Howling Den', 'Abandoned Catacombs'])
    expect(view.selectedRegion.groups.flatMap((group) => group.locations).find((location) => location.id === 'howling-den')).toMatchObject({ type: 'dungeon', state: 'locked', unlockText: 'Defeat Forest Heart' })
  })

  it('keeps active combat separate from a browsed location', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.threatCleared = 7
    const view = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedContinentId: 'continent-1', selectedRegionId: 'first-frontier', selectedLocationId: 'howling-den' })

    expect(view.activeLocation?.id).toBe('whispering-woods')
    expect(view.activeLocation?.state).toBe('active')
    expect(view.selectedLocation?.id).toBe('howling-den')
    expect(view.selectedLocation?.state).toBe('locked')
    expect(view.breadcrumb).toBe('Continent I / First Frontier / Howling Den')
  })

  it('keeps Shattered Frontier locked until the existing Edrin milestone', () => {
    const state = createInitialState()
    const before = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedRegionId: 'shattered-frontier', selectedLocationId: 'fractured-approach' })
    expect(before.regions.find((region) => region.id === 'shattered-frontier')).toMatchObject({ state: 'locked', unlockText: "Defeat Archmage Edrin's Shade" })

    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    const after = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedRegionId: 'shattered-frontier', selectedLocationId: 'fractured-approach' })
    expect(after.regions.find((region) => region.id === 'shattered-frontier')).toMatchObject({ state: 'available' })
    expect(after.selectedRegion.groups.flatMap((group) => group.locations).map((location) => location.id)).toHaveLength(12)
  })
})
