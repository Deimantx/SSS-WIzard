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

  it('shows authored combat identities and power before Bestiary discovery', () => {
    const state = createInitialState()
    const view = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedLocationId: 'whispering-woods' })
    const location = view.selectedLocation

    expect(location?.targeting?.targets.find((target) => target.monsterId === 'tempest-stag')).toMatchObject({ name: 'Tempest Stag', known: false, powerRating: expect.any(Number) })
    expect(location?.boss).toMatchObject({ name: 'Forest Heart', known: false, powerRating: expect.any(Number) })
    expect(location?.encounters.find((encounter) => encounter.monsterId === 'tempest-stag')).toMatchObject({ name: 'Tempest Stag', known: false, powerRating: expect.any(Number) })
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
    expect(view.selectedLocation?.targeting).toBeNull()
    expect(view.selectedLocation?.boss).toBeNull()
    expect(view.selectedContinent.name).toBe('Continent I')
    expect(view.selectedRegion.name).toBe('First Frontier')
    expect(view.selectedLocation?.name).toBe('Howling Den')
  })

  it('presents the Howling Den Zone Affix and the fixed Catacombs sequence', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    const view = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedLocationId: 'howling-den' })
    expect(view.selectedLocation?.targeting?.targets).toHaveLength(6)
    expect(view.selectedLocation?.zoneAffix).toMatchObject({ id: 'frenzied', name: 'Frenzied' })
    expect(view.selectedLocation?.bossHunt).toMatchObject({ bossLabel: 'ELITE BOSS', threatCurrent: 0, threatRequired: 10000, state: 'building' })
    expect(view.selectedLocation?.targeting?.targets.every((target) => !('minorAffixId' in target))).toBe(true)

    const catacombs = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedLocationId: 'abandoned-catacombs' }).selectedLocation
    expect(catacombs?.sequence?.steps.map((step) => step.monsterId)).toEqual(['restless-skeleton', 'grave-wraith', 'fallen-acolyte', 'archmage-edrin-shade'])
    const sequenceSteps = catacombs?.sequence?.steps ?? []
    expect(sequenceSteps[sequenceSteps.length - 1]?.role).toBe('boss')
    expect(catacombs?.firstClearUnlockPreview).toHaveLength(5)
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

  it('presents the final Black Sigil topology and keeps target cards distinct from the dungeon run', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    const hall = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedRegionId: 'black-sigil-reach', selectedLocationId: 'hall-of-unbound-names' }).selectedLocation
    expect(hall).toMatchObject({ type: 'elite-zone', encounterMode: 'targeted', zoneAffix: { id: 'vicious' } })
    expect(hall?.targeting?.targets.map((target) => target.monsterId)).toEqual(['name-eater', 'bound-echo', 'hollow-liturgist', 'whisper-archivist', 'nameless-cantor', 'oathless-confessor', 'unwritten-hierophant'])
    expect(hall?.targeting?.targets.every((target) => !('resonance' in target))).toBe(true)

    const vault = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedRegionId: 'black-sigil-reach', selectedLocationId: 'vault-of-the-black-sigil' }).selectedLocation
    expect(vault).toMatchObject({ type: 'elite-zone', encounterMode: 'targeted', zoneAffix: { id: 'armored' } })
    expect(vault?.targeting?.targets.map((target) => target.monsterId)).toEqual(['black-seal-parasite', 'inkbound-specter', 'sigil-guardian', 'vault-devourer', 'sealbound-custodian', 'blackscript-colossus', 'voidseal-arbiter'])

    state.progress.bossKillsByBoss['unspoken-prelate'] = 1
    state.progress.bossKillsByBoss['sigil-warden'] = 1
    const gate = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedRegionId: 'black-sigil-reach', selectedLocationId: 'black-gate' }).selectedLocation
    expect(gate).toMatchObject({ type: 'dungeon', encounterMode: 'sequence', targeting: null, bossHunt: null, firstClearUnlockPreview: [{ id: 'world-tier-5', label: 'World Tier 5' }] })
    expect(gate?.sequence?.steps.map((step) => step.monsterId)).toEqual(['gatebound-remnant', 'black-rift-stalker', 'portalbound-acolyte', 'sealbreaker-construct', 'black-gatekeeper'])
  })

  it('never derives sequence Dungeon state from stale or debug Threat', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    state.progress.bossKillsByBoss['unspoken-prelate'] = 1
    state.progress.bossKillsByBoss['sigil-warden'] = 1
    state.combat.active = true
    state.combat.dungeonId = 'black-gate'
    state.combat.threatCleared = Number.MAX_SAFE_INTEGER

    const gate = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedRegionId: 'black-sigil-reach', selectedLocationId: 'black-gate' }).selectedLocation
    expect(gate?.state).not.toBe('boss-ready')
  })
})
