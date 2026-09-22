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

  it('presents First Frontier as one authored-order location list', () => {
    const state = createInitialState()
    const view = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedLocationId: 'whispering-woods' })

    expect(view.selectedContinent.name).toBe('Continent I')
    expect(view.selectedRegion.name).toBe('First Frontier')
    expect(view.selectedRegion.locations.map((location) => location.name)).toEqual(['Whispering Woods', 'Howling Den', 'Abandoned Catacombs'])
    expect(view.selectedRegion.locations.find((location) => location.id === 'howling-den')).toMatchObject({ type: 'elite-zone', state: 'locked', unlockText: 'Defeat Forest Heart' })
    expect(view.selectedLocation?.targeting?.targets.map((target) => target.monsterId)).toEqual(['forest-wisp', 'thornling', 'dewbound-sprite', 'cinder-moth', 'stone-root', 'grove-sentinel', 'tempest-stag'])
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
    expect(view.selectedContinent.name).toBe('Continent I')
    expect(view.selectedRegion.name).toBe('First Frontier')
    expect(view.selectedLocation?.name).toBe('Howling Den')
  })

  it('unlocks the four authored Regions on their existing boss milestones', () => {
    const state = createInitialState()
    const before = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedRegionId: 'elemental-scar', selectedLocationId: 'fractured-approach' })
    expect(before.regions.map((region) => [region.id, region.state])).toEqual([['first-frontier', 'available'], ['elemental-scar', 'locked'], ['shattered-meridian', 'locked'], ['black-sigil-reach', 'locked']])
    expect(before.regions.find((region) => region.id === 'elemental-scar')).toMatchObject({ state: 'locked', unlockText: "Defeat Archmage Edrin's Shade" })

    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    const afterEdrin = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedRegionId: 'elemental-scar', selectedLocationId: 'fractured-approach' })
    expect(afterEdrin.regions.find((region) => region.id === 'elemental-scar')).toMatchObject({ state: 'available' })
    expect(afterEdrin.selectedRegion.locations.map((location) => location.id)).toEqual(['fractured-approach', 'flooded-reliquary', 'ashen-watch', 'rootscar-hollow', 'crossroads-of-ruin'])

    state.progress.bossKillsByBoss['crossroads-keeper'] = 1
    const afterKeeper = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedRegionId: 'shattered-meridian', selectedLocationId: 'graveglass-hollow' })
    expect(afterKeeper.regions.find((region) => region.id === 'shattered-meridian')).toMatchObject({ state: 'available' })

    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    const afterSplitter = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedRegionId: 'black-sigil-reach', selectedLocationId: 'hall-of-unbound-names' })
    expect(afterSplitter.regions.find((region) => region.id === 'black-sigil-reach')).toMatchObject({ state: 'available' })
  })
})
