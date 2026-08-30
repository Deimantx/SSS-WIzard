import { describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import type { GameState } from '../../types'
import { spawnEnemy } from '../combat/combatRuntime'
import { applyStatus } from '../combat/statusRuntime'
import { advanceGameState } from './advanceGameState'
import { SIMULATION_QUANTUM_MS } from './simulationConstants'

const cloneState = (state: GameState) => JSON.parse(JSON.stringify(state)) as GameState
const comparableStatuses = (state: GameState, actor: 'player' | 'enemy') => {
  const statuses = actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses
  return statuses.map(({ appliedAt: _appliedAt, ...status }) => status)
}

const combatFixture = () => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.player.maxHealth = 10_000
  state.player.health = 10_000
  spawnEnemy(state, 'forest-wisp')
  state.combat.enemyMaxHp = 100_000
  state.combat.enemyHp = 100_000
  return state
}

const snapshot = (state: GameState) => ({
  player: { health: state.player.health, mana: state.player.mana },
  activities: {
    research: state.activities.research,
    transmutation: state.activities.transmutation,
  },
  combat: {
    active: state.combat.active,
    enemyId: state.combat.enemyId,
    enemyHp: state.combat.enemyHp,
    enemyBarrier: state.combat.enemyBarrier,
    enemyBarrierRemainingMs: state.combat.enemyBarrierRemainingMs,
    playerBarrier: state.combat.playerBarrier,
    playerBarrierRemainingMs: state.combat.playerBarrierRemainingMs,
    enemyActionPatternId: state.combat.enemyActionPatternId,
    enemyActionIndex: state.combat.enemyActionIndex,
    enemyActionTimerMs: state.combat.enemyActionTimerMs,
    enemyActionRecoveryMs: state.combat.enemyActionRecoveryMs,
    enemyTelegraphMs: state.combat.enemyTelegraphMs,
    enemyTelegraphActionId: state.combat.enemyTelegraphActionId,
    enemyTelegraphStepId: state.combat.enemyTelegraphStepId,
    enemyTelegraphPatternId: state.combat.enemyTelegraphPatternId,
    playerAttackTimerMs: state.combat.playerAttackTimerMs,
    encounterTimerMs: state.combat.encounterTimerMs,
    spellCooldowns: state.combat.spellCooldowns,
    playerStatuses: comparableStatuses(state, 'player'),
    enemyStatuses: comparableStatuses(state, 'enemy'),
  },
})

const advanceFine = (state: GameState, durationMs: number) => {
  for (let elapsed = 0; elapsed < durationMs; elapsed += SIMULATION_QUANTUM_MS) {
    advanceGameState(state, Math.min(SIMULATION_QUANTUM_MS, durationMs - elapsed), { mode: 'live' })
  }
}

describe('canonical simulation quantum parity', () => {
  it('keeps Auto-Cast, Basic Attacks, and shared Mana ordering identical for fine and coarse callers', () => {
    const fine = combatFixture()
    fine.progress.spellRanks['fire-bolt'] = 1
    fine.activities.autoCast['fire-bolt'] = true
    fine.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }
    fine.player.mana = 0
    const coarse = cloneState(fine)

    advanceFine(fine, 30_000)
    for (let elapsed = 0; elapsed < 30_000; elapsed += 1_000) advanceGameState(coarse, 1_000, { mode: 'banked' })

    expect(snapshot(coarse)).toEqual(snapshot(fine))
    expect(fine.combat.spellCooldowns['fire-bolt']).toBeGreaterThan(0)
    expect(fine.combat.playerAttackTimerMs).toBeGreaterThan(0)
  })

  it('keeps deterministic enemy Action progression and timed Statuses identical', () => {
    const fine = combatFixture()
    const source = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'parity-status', school: 'fire' as const, tags: ['spell' as const, 'fire' as const] }
    applyStatus(fine, 'enemy', 'burning', source, { now: 0 })
    const coarse = cloneState(fine)

    advanceFine(fine, 12_000)
    for (let elapsed = 0; elapsed < 12_000; elapsed += 1_000) advanceGameState(coarse, 1_000, { mode: 'banked' })

    expect(snapshot(coarse)).toEqual(snapshot(fine))
  })

  it('preserves encounter transition timing and the paused no-enemy combat state', () => {
    const fine = createInitialState()
    fine.combat.active = true
    fine.combat.dungeonId = 'whispering-woods'
    fine.combat.encounterTimerMs = 250
    fine.combat.playerAttackTimerMs = 777
    const coarse = cloneState(fine)
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)

    try {
      advanceFine(fine, 1_000)
      advanceGameState(coarse, 1_000, { mode: 'banked' })
    } finally {
      random.mockRestore()
    }

    expect(snapshot(coarse)).toEqual(snapshot(fine))
    expect(fine.combat.enemyId).toBe('forest-wisp')
  })

  it('uses the same partial final quantum as repeated fine callers', () => {
    const fine = combatFixture()
    const coarse = cloneState(fine)

    advanceFine(fine, 250)
    advanceGameState(coarse, 250, { mode: 'banked' })

    expect(snapshot(coarse)).toEqual(snapshot(fine))
  })
})
