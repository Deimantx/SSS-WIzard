import { beforeEach, describe, expect, it } from 'vitest'
import { COMBAT_LOCATIONS } from '../../content/combat-locations/worldNavigation'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'

const installActiveReadyRun = () => {
  const state = createInitialState()
  for (const bossId of ['archmage-edrin-shade', 'corrupted-elemental-gatekeeper', 'crossroads-keeper', 'meridian-splitter'] as const) state.progress.bossKillsByBoss[bossId] = 1
  state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true
  state.combat.active = true
  state.combat.locationId = 'whispering-woods'
  state.combat.targetEnemyId = 'forest-wisp'
  state.combat.threatCleared = COMBAT_LOCATIONS['whispering-woods'].threatRequired!
  state.combat.activeSpellLoadout = { presetId: null, presetName: 'Test Loadout', slots: [{ spellId: 'fire-bolt', autoCast: false }], signature: 'fire-bolt:0' }
  state.progress.autoHuntBossUnlocked = true
  useGameStore.setState(state)
}

describe('targeted Boss and Auto Hunt flow', () => {
  beforeEach(() => installActiveReadyRun())

  it('engages a ready Boss immediately through the canonical action', () => {
    useGameStore.getState().engageBoss('forest-heart')

    expect(useGameStore.getState().combat.enemyId).toBe('forest-heart')
    expect(useGameStore.getState().combat.inBossFight).toBe(true)
  })

  it('queues a ready Boss immediately when Auto Hunt turns on', () => {
    useGameStore.getState().toggleAutoHunt('whispering-woods')

    expect(useGameStore.getState().progress.autoHuntBossByLocation['whispering-woods']).toBe(true)
    expect(useGameStore.getState().combat.pendingBossId).toBe('forest-heart')
  })

  it('cancels a pending Boss when Auto Hunt turns off', () => {
    const game = useGameStore.getState()
    game.toggleAutoHunt('whispering-woods')
    game.toggleAutoHunt('whispering-woods')

    expect(useGameStore.getState().progress.autoHuntBossByLocation['whispering-woods']).toBe(false)
    expect(useGameStore.getState().combat.pendingBossId).toBeNull()
  })

  it('does not despawn an active Boss when Auto Hunt turns off', () => {
    const game = useGameStore.getState()
    game.toggleAutoHunt('whispering-woods')
    useGameStore.setState((state) => { state.combat.enemyId = 'forest-heart'; state.combat.inBossFight = true; state.combat.pendingBossId = null; return state })

    game.toggleAutoHunt('whispering-woods')

    expect(useGameStore.getState().combat.enemyId).toBe('forest-heart')
    expect(useGameStore.getState().combat.inBossFight).toBe(true)
    expect(useGameStore.getState().progress.autoHuntBossByLocation['whispering-woods']).toBe(false)
  })

  it('does not queue a boss in Gloamridge with a Hunter contract active', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.locationId = 'hunters-ground'
    state.combat.targetEnemyId = 'ashen-tracker'
    state.combat.threatCleared = 0
    state.combat.activeSpellLoadout = { presetId: null, presetName: 'Test Loadout', slots: [{ spellId: 'fire-bolt', autoCast: false }], signature: 'fire-bolt:0' }
    state.progress.autoHuntBossUnlocked = true
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.progress.huntersOrder.activeContract = { id: 'normal-hunt', targetSpec: { type: 'ground', groundId: 'hunters-ground' }, target: 2, progress: 0, tier: 'prestigious', reputationReward: 100, marksReward: 3 }
    useGameStore.setState(state)

    useGameStore.getState().toggleAutoHunt('hunters-ground')
    expect(useGameStore.getState().combat.pendingBossId).toBeNull()
  })

  it('keeps Gloamridge bossless even when legacy Auto Hunt and boss-contract state is present', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.locationId = 'hunters-ground'
    state.combat.targetEnemyId = 'ashen-tracker'
    state.combat.threatCleared = 999999
    state.progress.autoHuntBossUnlocked = true
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.progress.huntersOrder.reputation = 32500
    state.progress.huntersOrder.activeContract = { id: 'apex-hunt', targetSpec: { type: 'boss', monsterId: 'nightglass-alpha' }, target: 1, progress: 0, tier: 'prestigious', reputationReward: 100, marksReward: 12 }
    useGameStore.setState(state)

    useGameStore.getState().toggleAutoHunt('hunters-ground')

    expect(COMBAT_LOCATIONS['hunters-ground'].boss).toBeNull()
    expect(useGameStore.getState().combat.pendingBossId).toBeNull()
  })
})
