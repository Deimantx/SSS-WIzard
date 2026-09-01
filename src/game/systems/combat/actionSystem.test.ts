import { describe, expect, it } from 'vitest'
import { createInitialState, SAVE_VERSION } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters'
import { advanceGameState } from '../simulation/advanceGameState'
import { executeCombatEffects } from './effectResolver'
import { applyStatus, clearStatuses } from './statusRuntime'
import { spawnEnemy, resolveCombatDeaths } from './combatRuntime'
import { clearCurrentEnemyAction, getCurrentEnemyActionStep, getNextEnemyActionStep, resolveCurrentEnemyAction, resolveEnemyBasicAttackTimeMs, resolveEnemySkillActionTimeMs, setEnemyActionPattern, startNextEnemyAction } from './actionRuntime'
import type { CombatEvent, CombatEventSink } from './combatTypes'
import { migrateSave } from '../../../persistence/migrations'

const stateWithEnemy = (enemyId: Parameters<typeof spawnEnemy>[1] = 'forest-wisp') => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  spawnEnemy(state, enemyId)
  state.combat.enemyHp = Math.max(state.combat.enemyHp, 10_000)
  state.combat.enemyMaxHp = Math.max(state.combat.enemyMaxHp, 10_000)
  return state
}

const advance = (state: ReturnType<typeof createInitialState>, durationMs: number) => {
  let remaining = durationMs
  while (remaining > 0) {
    const step = Math.min(1000, remaining)
    advanceGameState(state, step, { mode: 'live' })
    remaining -= step
  }
}

const startAt = (state: ReturnType<typeof createInitialState>, index: number, sink?: CombatEventSink) => {
  clearCurrentEnemyAction(state)
  state.combat.enemyNextActionIndex = index
  expect(startNextEnemyAction(state, executeCombatEffects, 0, sink)).toBe(true)
}

describe('classic real-time combat action timing', () => {
  it('starts with a timed Basic Attack and waits until expiry before damage', () => {
    const state = stateWithEnemy()
    const initialHealth = state.player.health
    expect(state.combat.enemyCurrentActionId).toBeNull()
    expect(state.combat.enemyCurrentStepId).toBe('basic-1')
    expect(state.combat.enemyActionDurationMs).toBe(MONSTERS['forest-wisp'].basicAttackTimeMs)

    advance(state, MONSTERS['forest-wisp'].basicAttackTimeMs - 1)
    expect(state.player.health).toBe(initialHealth)
    advance(state, 1)
    expect(state.player.health).toBe(initialHealth - MONSTERS['forest-wisp'].basicAttackDamage)
    expect(state.combat.enemyCurrentStepId).toBe('basic-2')
    expect(state.combat.enemyActionTimerMs).toBe(MONSTERS['forest-wisp'].basicAttackTimeMs)
  })

  it('uses one full Action Time for Skills and applies effects only at expiry', () => {
    const state = stateWithEnemy()
    startAt(state, 2)
    const initialHealth = state.player.health
    expect(state.combat.enemyCurrentActionId).toBe('arc-spark')
    expect(state.combat.enemyActionDurationMs).toBe(2000)
    advance(state, 1999)
    expect(state.player.health).toBe(initialHealth)
    advance(state, 1)
    expect(state.player.health).toBe(initialHealth - 12)
  })

  it('starts the next Pattern step immediately after resolve with no recovery gap', () => {
    const state = stateWithEnemy()
    startAt(state, 2)
    state.combat.enemyActionTimerMs = 0
    expect(resolveCurrentEnemyAction(state, executeCombatEffects)).toBe(true)
    expect(state.combat.enemyCurrentStepId).toBe('basic-1')
    expect(state.combat.enemyCurrentActionId).toBeNull()
    expect(state.combat.enemyActionTimerMs).toBe(MONSTERS['forest-wisp'].basicAttackTimeMs)
    expect(getNextEnemyActionStep(state)?.id).toBe('basic-2')
  })

  it('commits the current action before start observers and emits a neutral start event', () => {
    const state = stateWithEnemy()
    const events: CombatEvent[] = []
    startAt(state, 2, { push: (event) => events.push(event) })
    expect(events[events.length - 1]).toMatchObject({ actionId: 'arc-spark', actionPhase: 'start', durationMs: 2000, category: 'system' })
    expect(state.combat.enemyCurrentStepId).toBe('arc-spark-step')
    expect(state.combat.enemyActionTimerMs).toBe(2000)
  })

  it('preserves the current action origin when the selected Pattern changes', () => {
    const state = stateWithEnemy('corrupted-greatbear')
    startAt(state, 2)
    expect(state.combat.enemyCurrentActionPatternId).toBe('default')
    expect(setEnemyActionPattern(state, 'corrupted')).toBe(true)
    expect(state.combat.enemyActionPatternId).toBe('corrupted')
    expect(state.combat.enemyNextActionIndex).toBe(0)
    expect(state.combat.enemyCurrentActionPatternId).toBe('default')
    state.combat.enemyActionTimerMs = 0
    resolveCurrentEnemyAction(state, executeCombatEffects)
    expect(state.combat.enemyCurrentStepId).toBe('basic-1')
    expect(state.combat.enemyCurrentActionPatternId).toBe('corrupted')
  })

  it('uses separate Basic Attack and Action speed modifiers with duration snapshots', () => {
    const state = stateWithEnemy('corrupted-greatbear')
    const basicBase = state.combat.enemyActionDurationMs
    applyStatus(state, 'enemy', 'haste', { actor: 'enemy', kind: 'system', sourceId: 'test' })
    expect(state.combat.enemyActionDurationMs).toBe(basicBase)
    clearCurrentEnemyAction(state)
    state.combat.enemyNextActionIndex = 2
    startNextEnemyAction(state, executeCombatEffects)
    expect(state.combat.enemyActionDurationMs).toBe(resolveEnemySkillActionTimeMs(state, 1800))

    const player = stateWithEnemy()
    applyStatus(player, 'player', 'quickening', { actor: 'player', kind: 'system', sourceId: 'test' })
    const basicDuration = player.combat.playerAttackDurationMs
    advance(player, 2800)
    expect(player.combat.playerAttackDurationMs).toBe(Math.round(basicDuration * 0.75))
  })

  it('applies Chilled to both Basic Attack and Action timing', () => {
    const state = stateWithEnemy()
    applyStatus(state, 'enemy', 'chilled', { actor: 'player', kind: 'spell', sourceId: 'test' })
    expect(resolveEnemyBasicAttackTimeMs(state, 2500)).toBe(3000)
    expect(resolveEnemySkillActionTimeMs(state, 2000)).toBe(2400)
  })

  it('pauses the current timer and identity while the enemy is Stunned', () => {
    const state = stateWithEnemy()
    const stepId = state.combat.enemyCurrentStepId
    const timer = state.combat.enemyActionTimerMs
    applyStatus(state, 'enemy', 'stunned', { actor: 'player', kind: 'spell', sourceId: 'stun' })
    advance(state, 1000)
    expect(state.combat.enemyCurrentStepId).toBe(stepId)
    expect(state.combat.enemyActionTimerMs).toBe(timer)
    clearStatuses(state, 'enemy')
    advance(state, timer - 1)
    expect(state.combat.enemyCurrentStepId).toBe(stepId)
    advance(state, 1)
    expect(state.combat.enemyCurrentStepId).not.toBe(stepId)
  })

  it('does not recursively resolve when an effect modifies the current timer', () => {
    const state = stateWithEnemy()
    startAt(state, 2)
    state.combat.enemyActionTimerMs = 1
    const before = state.player.health
    executeCombatEffects(state, [{ type: 'modify-action-timer', target: 'opponent', action: 'current', amountMs: -500 }], { actor: 'player', kind: 'spell', sourceId: 'timer-test' })
    expect(state.combat.enemyActionTimerMs).toBe(0)
    expect(state.player.health).toBe(before)
    resolveCurrentEnemyAction(state, executeCombatEffects)
    expect(state.player.health).toBe(before - 12)
  })

  it('cleans current timing state on enemy death and player defeat', () => {
    const enemy = stateWithEnemy()
    enemy.combat.enemyHp = 0
    resolveCombatDeaths(enemy)
    expect(enemy.combat.enemyId).toBeNull()
    expect(enemy.combat.enemyCurrentStepId).toBeNull()
    expect(enemy.combat.enemyActionTimerMs).toBe(0)

    const player = stateWithEnemy()
    player.player.health = 0
    resolveCombatDeaths(player)
    expect(player.combat.active).toBe(false)
    expect(player.combat.enemyId).toBeNull()
    expect(player.combat.enemyCurrentStepId).toBeNull()
  })
})

describe('V17 combat timing migration', () => {
  it('restarts a valid V17 Skill at its full new Action Time', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 17, combat: { ...initial.combat, active: true, enemyId: 'forest-wisp', enemyActionPatternId: 'default', enemyActionIndex: 0, enemyActionTimerMs: 700, enemyActionRecoveryMs: 2800, enemyTelegraphActionId: 'arc-spark', enemyTelegraphStepId: 'arc-spark-step', enemyTelegraphPatternId: 'default', enemyTelegraphMs: 500 } })
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.combat.enemyActionPatternId).toBe('default')
    expect(migrated.combat.enemyNextActionIndex).toBe(0)
    expect(migrated.combat.enemyCurrentActionId).toBe('arc-spark')
    expect(migrated.combat.enemyCurrentStepId).toBe('arc-spark-step')
    expect(migrated.combat.enemyCurrentActionPatternId).toBe('default')
    expect(migrated.combat.enemyActionDurationMs).toBe(2000)
    expect(migrated.combat.enemyActionTimerMs).toBe(2000)
  })

  it('discards V17 recovery progress and preserves its next cursor', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 17, combat: { ...initial.combat, active: true, enemyId: 'forest-wisp', enemyActionPatternId: 'default', enemyActionIndex: 2, enemyActionTimerMs: 900, enemyActionRecoveryMs: 2800 } })
    expect(migrated.combat.enemyNextActionIndex).toBe(2)
    expect(migrated.combat.enemyCurrentActionId).toBeNull()
    expect(migrated.combat.enemyCurrentStepId).toBeNull()
    expect(migrated.combat.enemyActionTimerMs).toBe(0)
    expect(migrated.combat.enemyActionDurationMs).toBe(0)
  })

  it('clears invalid V17 active action references safely', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 17, combat: { ...initial.combat, active: true, enemyId: 'forest-wisp', enemyActionPatternId: 'removed', enemyActionIndex: 99, enemyTelegraphActionId: 'removed', enemyTelegraphMs: 500 } })
    expect(migrated.combat.enemyActionPatternId).toBe('default')
    expect(migrated.combat.enemyNextActionIndex).toBe(0)
    expect(migrated.combat.enemyCurrentActionId).toBeNull()
    expect(migrated.combat.enemyCurrentStepId).toBeNull()
  })
})
