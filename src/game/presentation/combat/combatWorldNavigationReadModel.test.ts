import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { buildCombatWorldNavigationViewModel, getInitialCombatLocationId } from './combatWorldNavigationReadModel'

describe('combat world navigation read model', () => {
  it('defaults to the active location, then the last entered location, then the first unlocked location', () => {
    const state = createInitialState()
    expect(getInitialCombatLocationId({ combat: state.combat, progress: state.progress })).toBe('stonewake-hollow')

    state.progress.bossKillsByBoss['forest-heart'] = 1
    expect(getInitialCombatLocationId({ combat: state.combat, lastEnteredCombatLocationId: 'howling-den', progress: state.progress })).toBe('howling-den')

    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
    expect(getInitialCombatLocationId({ combat: state.combat, lastEnteredCombatLocationId: 'howling-den', progress: state.progress })).toBe('whispering-woods')
  })

  it('presents First Frontier as one authored-order location list', () => {
    const state = createInitialState()
    state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true
    const view = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedLocationId: 'whispering-woods' })

    expect(view.allLocations.map((location) => location.name).slice(0, 8)).toEqual(['Stonewake Hollow', 'Galecrest Heights', 'Tideglass Caverns', 'Emberfall Basin', 'Whispering Woods', 'Howling Den', 'Gloamridge', 'Abandoned Catacombs'])
    expect(view.allLocations.find((location) => location.id === 'howling-den')).toMatchObject({ type: 'elite-zone', state: 'locked', unlockText: 'Defeat Forest Heart' })
    expect(view.selectedLocation?.targeting?.targets.map((target) => target.monsterId)).toEqual(['forest-wisp', 'thornling', 'dewbound-sprite', 'cinder-moth', 'stone-root', 'grove-sentinel', 'tempest-stag'])
  })

  it('models Gloamridge as a first-class targeted Hunting Ground without boss presentation', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    const ground = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedLocationId: 'hunters-ground' }).selectedLocation
    expect(ground).toMatchObject({ id: 'hunters-ground', name: 'Gloamridge', type: 'hunting-ground', typeLabel: 'HUNTING GROUND', encounterMode: 'targeted', bossHunt: null, boss: null })
    expect(ground?.targeting?.targets).toHaveLength(7)
    expect(ground?.targeting?.targets.map((target) => target.monsterId)).toContain('nightglass-alpha')
  })

  it('shows authored combat identities and power before Bestiary discovery', () => {
    const state = createInitialState()
    state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true
    const view = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedLocationId: 'whispering-woods' })
    const location = view.selectedLocation

    expect(location?.targeting?.targets.find((target) => target.monsterId === 'tempest-stag')).toMatchObject({ name: 'Tempest Stag', known: false, powerRating: expect.any(Number) })
    expect(location?.boss).toMatchObject({ name: 'Forest Heart', known: false, powerRating: expect.any(Number) })
    expect(location?.encounters.find((encounter) => encounter.monsterId === 'tempest-stag')).toMatchObject({ name: 'Tempest Stag', known: false, powerRating: expect.any(Number) })
  })

  it('keeps active combat separate from a browsed location', () => {
    const state = createInitialState()
    state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
    state.combat.threatCleared = 7
    const view = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedLocationId: 'howling-den' })

    expect(view.activeLocation?.id).toBe('whispering-woods')
    expect(view.activeLocation?.state).toBe('active')
    expect(view.selectedLocation?.id).toBe('howling-den')
    expect(view.selectedLocation?.state).toBe('locked')
    expect(view.selectedLocation?.targeting).toBeNull()
    expect(view.selectedLocation?.boss).toBeNull()
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

  it('presents the final Black Sigil topology and keeps target cards distinct from the dungeon run', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    const hall = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedLocationId: 'hall-of-unbound-names' }).selectedLocation
    expect(hall).toMatchObject({ type: 'elite-zone', encounterMode: 'targeted', zoneAffix: { id: 'vicious' } })
    expect(hall?.targeting?.targets.map((target) => target.monsterId)).toEqual(['name-eater', 'bound-echo', 'hollow-liturgist', 'whisper-archivist', 'nameless-cantor', 'oathless-confessor', 'unwritten-hierophant'])
    expect(hall?.targeting?.targets.every((target) => !('resonance' in target))).toBe(true)

    const vault = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedLocationId: 'vault-of-the-black-sigil' }).selectedLocation
    expect(vault).toMatchObject({ type: 'elite-zone', encounterMode: 'targeted', zoneAffix: { id: 'armored' } })
    expect(vault?.targeting?.targets.map((target) => target.monsterId)).toEqual(['black-seal-parasite', 'inkbound-specter', 'sigil-guardian', 'vault-devourer', 'sealbound-custodian', 'blackscript-colossus', 'voidseal-arbiter'])

    state.progress.bossKillsByBoss['unspoken-prelate'] = 1
    state.progress.bossKillsByBoss['sigil-warden'] = 1
    const gate = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedLocationId: 'black-gate' }).selectedLocation
    expect(gate).toMatchObject({ type: 'dungeon', encounterMode: 'sequence', targeting: null, bossHunt: null, firstClearUnlockPreview: [{ id: 'world-tier-5', label: 'World Tier 5' }] })
    expect(gate?.sequence?.steps.map((step) => step.monsterId)).toEqual(['gatebound-remnant', 'black-rift-stalker', 'portalbound-acolyte', 'sealbreaker-construct', 'black-gatekeeper'])
  })

  it('never derives sequence Dungeon state from stale or debug Threat', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    state.progress.bossKillsByBoss['unspoken-prelate'] = 1
    state.progress.bossKillsByBoss['sigil-warden'] = 1
    state.combat.active = true
    state.combat.locationId = 'black-gate'
    state.combat.threatCleared = Number.MAX_SAFE_INTEGER

    const gate = buildCombatWorldNavigationViewModel({ progress: state.progress, combat: state.combat, selectedLocationId: 'black-gate' }).selectedLocation
    expect(gate?.state).not.toBe('boss-ready')
  })
})
