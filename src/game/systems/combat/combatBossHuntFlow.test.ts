import { beforeEach, describe, expect, it } from 'vitest'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'

const installActiveReadyRun = () => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.combat.targetEnemyId = 'forest-wisp'
  state.combat.threatCleared = DUNGEONS['whispering-woods'].threatRequired
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

    expect(useGameStore.getState().progress.autoHuntBossByDungeon['whispering-woods']).toBe(true)
    expect(useGameStore.getState().combat.pendingBossId).toBe('forest-heart')
  })

  it('cancels a pending Boss when Auto Hunt turns off', () => {
    const game = useGameStore.getState()
    game.toggleAutoHunt('whispering-woods')
    game.toggleAutoHunt('whispering-woods')

    expect(useGameStore.getState().progress.autoHuntBossByDungeon['whispering-woods']).toBe(false)
    expect(useGameStore.getState().combat.pendingBossId).toBeNull()
  })

  it('does not despawn an active Boss when Auto Hunt turns off', () => {
    const game = useGameStore.getState()
    game.toggleAutoHunt('whispering-woods')
    useGameStore.setState((state) => { state.combat.enemyId = 'forest-heart'; state.combat.inBossFight = true; state.combat.pendingBossId = null; return state })

    game.toggleAutoHunt('whispering-woods')

    expect(useGameStore.getState().combat.enemyId).toBe('forest-heart')
    expect(useGameStore.getState().combat.inBossFight).toBe(true)
    expect(useGameStore.getState().progress.autoHuntBossByDungeon['whispering-woods']).toBe(false)
  })
})
