import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters'
import type { CombatEvent, CombatSource, GameState } from '../../types'
import { executeCombatEffects } from '../combat/effectResolver'
import { clearCurrentEnemyAction, setEnemyActionPattern, startEnemyAction } from '../combat/actionRuntime'
import { applyStatus, getNextCombatStatusEventMs } from '../combat/statusRuntime'
import { spawnEnemy } from '../combat/combatRuntime'
import { advanceGameState } from './advanceGameState'

const playerSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'timeline-test', school: 'fire', tags: ['spell', 'magic', 'fire'] }

const stateWithEnemy = (enemyId: Parameters<typeof spawnEnemy>[1] = 'forest-wisp') => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.player.maxHealth = 10_000
  state.player.health = 10_000
  spawnEnemy(state, enemyId)
  state.combat.enemyHp = 100_000
  state.combat.enemyMaxHp = 100_000
  return state
}

const cloneState = (state: GameState) => JSON.parse(JSON.stringify(state)) as GameState

const combatSnapshot = (state: GameState) => ({
  playerHealth: state.player.health,
  enemyHp: state.combat.enemyHp,
  enemyNextActionIndex: state.combat.enemyNextActionIndex,
  enemyCurrentStepId: state.combat.enemyCurrentStepId,
  enemyCurrentActionId: state.combat.enemyCurrentActionId,
  enemyCurrentActionPatternId: state.combat.enemyCurrentActionPatternId,
  enemyActionTimerMs: state.combat.enemyActionTimerMs,
  enemyActionDurationMs: state.combat.enemyActionDurationMs,
  playerAttackTimerMs: state.combat.playerAttackTimerMs,
  playerAttackDurationMs: state.combat.playerAttackDurationMs,
  spellCooldowns: state.combat.spellCooldowns,
  playerBarrier: state.combat.playerBarrier,
  playerBarrierRemainingMs: state.combat.playerBarrierRemainingMs,
  enemyBarrier: state.combat.enemyBarrier,
  enemyBarrierRemainingMs: state.combat.enemyBarrierRemainingMs,
  playerStatuses: state.combat.playerStatuses.map(({ appliedAt: _appliedAt, ...status }) => status),
  enemyStatuses: state.combat.enemyStatuses.map(({ appliedAt: _appliedAt, ...status }) => status),
})

describe('shared combat timeline', () => {
  it('resolves an earlier enemy Action before a later player Barrier expiration', () => {
    const state = stateWithEnemy()
    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 10 }, mode: 'replace', durationMs: 80 }], playerSource)
    state.combat.enemyActionTimerMs = 20

    advanceGameState(state, 100, { mode: 'live' })

    expect(state.player.health).toBe(10_000)
    expect(state.combat.playerBarrier).toBe(0)
    expect(state.combat.playerBarrierRemainingMs).toBeNull()
  })

  it('resolves an earlier enemy Action before a later periodic Status tick', () => {
    const state = stateWithEnemy()
    applyStatus(state, 'enemy', 'burning', playerSource, { now: 0 })
    const burning = state.combat.enemyStatuses.find((status) => status.statusId === 'burning')
    if (!burning) throw new Error('Expected Burning status')
    burning.nextTickMs = 80
    state.combat.enemyActionTimerMs = 20
    const events: CombatEvent[] = []

    advanceGameState(state, 100, { mode: 'live', uiEvents: { push: (event) => events.push(event) } })

    const actionDamage = events.findIndex((event) => event.sourceKind === 'basic-attack' && event.category === 'basic-attack')
    const statusDamage = events.findIndex((event) => event.sourceKind === 'status' && event.category === 'damage')
    expect(actionDamage).toBeGreaterThanOrEqual(0)
    expect(statusDamage).toBeGreaterThan(actionDamage)
    expect(state.player.health).toBe(9_995)
  })

  it('keeps a Stunned action frozen until the exact mid-quantum expiry boundary', () => {
    const state = stateWithEnemy()
    const currentStepId = state.combat.enemyCurrentStepId
    state.combat.enemyActionTimerMs = 1_000
    applyStatus(state, 'enemy', 'stunned', playerSource, { durationMs: 50, now: 0 })

    advanceGameState(state, 100, { mode: 'live' })

    expect(state.combat.enemyCurrentStepId).toBe(currentStepId)
    expect(state.combat.enemyActionTimerMs).toBe(950)
    expect(state.combat.enemyStatuses.some((status) => status.statusId === 'stunned')).toBe(false)
  })

  it('snapshots Haste for the next Action before Haste expires later in the same quantum', () => {
    const state = stateWithEnemy('corrupted-greatbear')
    applyStatus(state, 'enemy', 'haste', playerSource, { durationMs: 50, now: 0 })
    clearCurrentEnemyAction(state)
    expect(setEnemyActionPattern(state, 'corrupted')).toBe(true)
    expect(startEnemyAction(state, 'corrupted-roar', executeCombatEffects)).toBe(true)
    state.combat.enemyActionTimerMs = 20

    advanceGameState(state, 100, { mode: 'live' })

    expect(state.combat.enemyCurrentStepId).toBe('crushing-maul-step')
    expect(state.combat.enemyActionDurationMs).toBe(MONSTERS['corrupted-greatbear'].actions['crushing-maul'].actionTimeMs)
    expect(state.combat.enemyActionTimerMs).toBeCloseTo(MONSTERS['corrupted-greatbear'].actions['crushing-maul'].actionTimeMs - 87.5)
  })

  it('ticks a Status applied by an Action for leftover time in the same quantum', () => {
    const state = stateWithEnemy('thornling')
    clearCurrentEnemyAction(state)
    state.combat.enemyNextActionIndex = 2
    expect(startEnemyAction(state, 'thorn-lash', executeCombatEffects)).toBe(true)
    state.combat.enemyActionTimerMs = 20

    advanceGameState(state, 100, { mode: 'live' })

    expect(state.combat.playerStatuses.find((status) => status.statusId === 'thorn-wound')).toMatchObject({ remainingMs: 5_920 })
  })

  it('does not make Auto-Cast ready before its internal cooldown boundary', () => {
    const state = stateWithEnemy()
    state.progress.spellRanks.ignite = 1
    state.activities.autoCast.ignite = true
    state.player.mana = state.player.maxMana
    state.combat.spellCooldowns.ignite = 80
    state.combat.enemyActionTimerMs = 20

    advanceGameState(state, 100, { mode: 'live' })

    expect(state.combat.enemyStatuses.find((status) => status.statusId === 'burning')).toMatchObject({ remainingMs: 5_980 })
  })

  it('preserves non-100ms Action timing across fine and coarse callers', () => {
    const fine = stateWithEnemy('thornling')
    applyStatus(fine, 'enemy', 'haste', playerSource, { durationMs: null, now: 0 })
    clearCurrentEnemyAction(fine)
    fine.combat.enemyNextActionIndex = 2
    expect(startEnemyAction(fine, 'thorn-lash', executeCombatEffects)).toBe(true)
    expect(fine.combat.enemyActionDurationMs).toBe(1_800)
    const coarse = cloneState(fine)

    for (let elapsed = 0; elapsed < 12_000; elapsed += 100) advanceGameState(fine, 100, { mode: 'live' })
    for (let elapsed = 0; elapsed < 12_000; elapsed += 1_000) advanceGameState(coarse, 1_000, { mode: 'banked' })

    expect(combatSnapshot(coarse)).toEqual(combatSnapshot(fine))
  })

  it('exposes the nearest Status boundary without taking ownership of Status resolution', () => {
    const state = stateWithEnemy()
    applyStatus(state, 'enemy', 'burning', playerSource, { durationMs: 500, now: 0 })
    const burning = state.combat.enemyStatuses.find((status) => status.statusId === 'burning')
    if (!burning) throw new Error('Expected Burning status')
    burning.nextTickMs = 80

    expect(getNextCombatStatusEventMs(state)).toBe(80)
  })
})
