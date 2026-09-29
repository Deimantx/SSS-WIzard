import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { discardDeveloperSandboxSnapshot, hasDeveloperSandboxSnapshot, restoreAndExitDeveloperSandbox } from '../developerSandbox'
import { clearDeveloperSandbox, getDeveloperToolsState } from '../developerToolsStore'
import { captureDeveloperScenario, runCustomDeveloperScenario } from './customScenarioRuntime'
import { validateDeveloperScenario } from './customScenarioSchema'

describe('Custom Developer Scenario snapshots', () => {
  beforeEach(() => {
    if (getDeveloperToolsState().sandbox.active) restoreAndExitDeveloperSandbox()
    else discardDeveloperSandboxSnapshot()
    clearDeveloperSandbox()
    useGameStore.setState(createInitialState())
  })

  it('captures a versioned data-only snapshot with combat, debug overrides, and a useful summary', () => {
    useGameStore.setState((state) => {
      state.ui.screen = 'hunters-order'
      state.player.health = 42
      state.debug.playerStats.spellPowerFlat = 160
      state.combat.playerBarrier = 27
      state.combat.enemyActionTimerMs = 890
      state.offlineBankMs = 120_000
      return state
    })
    const scenario = captureDeveloperScenario({ name: 'Trail Test', description: 'Exact active hunt', tags: ['hunter', 'combat'] })
    expect(scenario).toMatchObject({ scenarioSchemaVersion: 1, name: 'Trail Test', tags: ['hunter', 'combat'], snapshot: { viewContext: { screen: 'hunters-order' } } })
    expect(scenario.snapshot.gameState).toMatchObject({ player: { health: 42 }, debug: { playerStats: { spellPowerFlat: 160 } }, combat: { playerBarrier: 27, enemyActionTimerMs: 890 }, offlineBankMs: 120_000 })
    expect(scenario.snapshot.summary).toMatchObject({ hunterRankLabel: 'Tracker', combatActive: false, offlineBankMs: 120_000 })
    expect(validateDeveloperScenario(scenario).ok).toBe(true)
    expect('profileId' in scenario.snapshot.gameState).toBe(false)
  })

  it('rejects incompatible schema versions, identity fields, and malformed runtime states', () => {
    const scenario = captureDeveloperScenario({ name: 'Valid', description: '', tags: [] })
    expect(validateDeveloperScenario({ ...scenario, scenarioSchemaVersion: 9 })).toMatchObject({ ok: false })
    expect(validateDeveloperScenario({ ...scenario, profileId: 'profile-secret' })).toMatchObject({ ok: false })
    expect(validateDeveloperScenario({ ...scenario, snapshot: { ...scenario.snapshot, gameState: { player: {} } } })).toMatchObject({ ok: false })
  })

  it('runs a saved state inside the existing sandbox without replacing its restore anchor', () => {
    useGameStore.setState((state) => { state.player.health = 61; state.combat.playerBarrier = 19; state.combat.enemyActionTimerMs = 730; return state })
    const scenario = captureDeveloperScenario({ name: 'Saved State', description: '', tags: [] })
    expect(scenario.snapshot.gameState.combat).toMatchObject({ playerBarrier: 19, enemyActionTimerMs: 730 })
    useGameStore.setState((state) => { state.player.health = 23; return state })
    runCustomDeveloperScenario(scenario)
    expect(useGameStore.getState().player.health).toBe(61)
    expect(useGameStore.getState().notifications[0]?.text).toContain('Loaded scenario')
    expect(hasDeveloperSandboxSnapshot()).toBe(true)
    useGameStore.setState((state) => { state.player.health = 9; return state })
    expect(restoreAndExitDeveloperSandbox()).toBe(true)
    expect(useGameStore.getState().player.health).toBe(23)
  })
})
