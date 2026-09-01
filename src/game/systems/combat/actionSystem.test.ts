import { describe, expect, it } from 'vitest'
import { createInitialState, SAVE_VERSION } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { getCombatFlowPresentation } from '../../presentation/combat/combatFlowPresentation'
import { advanceGameState } from '../simulation/advanceGameState'
import { executeCombatEffects } from './effectResolver'
import { applyStatus, clearStatuses, tickStatuses } from './statusRuntime'
import { spawnEnemy, resolveCombatDeaths } from './combatRuntime'
import { clearCurrentEnemyAction, getCurrentEnemyActionStep, getNextEnemyActionStep, getEnemyAction, getEnemyActionPattern, getEnemyBasicAttackRate, getEnemySkillActionRate, getPlayerBasicAttackRate, resolveCurrentEnemyAction, startNextEnemyAction, setEnemyActionPattern, startEnemyAction } from './actionRuntime'
import { getCurrentEnemyActionTiming, getTimedActionState } from './actionTiming'
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

  it('aligns a manually started selected-Pattern action and documents standalone behavior', () => {
    const state = stateWithEnemy('corrupted-greatbear')
    clearCurrentEnemyAction(state)
    expect(setEnemyActionPattern(state, 'corrupted')).toBe(true)
    expect(startEnemyAction(state, 'crushing-maul', executeCombatEffects)).toBe(true)
    expect(state.combat.enemyNextActionIndex).toBe(3)

    clearCurrentEnemyAction(state)
    state.combat.enemyNextActionIndex = 4
    expect(startEnemyAction(state, 'groundbreaker', executeCombatEffects)).toBe(true)
    expect(state.combat.enemyNextActionIndex).toBe(4)
  })

  it('uses separate Basic Attack and Action rates with authored base work', () => {
    const state = stateWithEnemy('corrupted-greatbear')
    const basicBase = state.combat.enemyActionDurationMs
    applyStatus(state, 'enemy', 'haste', { actor: 'enemy', kind: 'system', sourceId: 'test' })
    expect(state.combat.enemyActionDurationMs).toBe(basicBase)
    clearCurrentEnemyAction(state)
    state.combat.enemyNextActionIndex = 2
    startNextEnemyAction(state, executeCombatEffects)
    expect(state.combat.enemyActionDurationMs).toBe(1800)
    expect(getEnemySkillActionRate(state)).toBeCloseTo(1.15)

    const player = stateWithEnemy()
    applyStatus(player, 'player', 'quickening', { actor: 'player', kind: 'system', sourceId: 'test' })
    const basicDuration = player.combat.playerAttackDurationMs
    advance(player, 2800)
    expect(player.combat.playerAttackDurationMs).toBe(basicDuration)
    expect(getPlayerBasicAttackRate(player)).toBeCloseTo(1.25)
  })

  it('applies Chilled to both Basic Attack and Action timing', () => {
    const state = stateWithEnemy()
    applyStatus(state, 'enemy', 'chilled', { actor: 'player', kind: 'spell', sourceId: 'test' })
    expect(getTimedActionState(2500, 2500, getEnemyBasicAttackRate(state)).etaMs).toBe(3125)
    expect(getTimedActionState(2000, 2000, getEnemySkillActionRate(state)).etaMs).toBe(2500)
    expect(getEnemyBasicAttackRate(state)).toBeCloseTo(0.8)
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

  it('keeps an alive stunned enemy without a committed action out of Combat Flow', () => {
    const monster = MONSTERS['forest-wisp']
    const action = monster.actions['arc-spark']
    const originalEffects = action.effects
    action.effects = [{ type: 'apply-status', target: 'self', statusId: 'stunned' }]
    try {
      const state = stateWithEnemy()
      startAt(state, 2)
      state.combat.enemyActionTimerMs = 0
      expect(resolveCurrentEnemyAction(state, executeCombatEffects)).toBe(true)
      expect(state.combat.enemyId).toBe('forest-wisp')
      expect(state.combat.enemyCurrentStepId).toBeNull()
      expect(getCurrentEnemyActionTiming(state)).toBeNull()

      const presentation = getCombatFlowPresentation({
        active: state.combat.active,
        dungeonId: state.combat.dungeonId,
        selectedDungeonId: 'whispering-woods',
        dungeon: DUNGEONS['whispering-woods'],
        enemy: monster,
        enemyId: state.combat.enemyId,
        threatCleared: state.combat.threatCleared,
        inBossFight: state.combat.inBossFight,
        encounterTimerMs: state.combat.encounterTimerMs,
        playerAttackTimerMs: state.combat.playerAttackTimerMs,
        playerAttackDurationMs: state.combat.playerAttackDurationMs,
        enemyActionTimerMs: state.combat.enemyActionTimerMs,
        enemyActionDurationMs: state.combat.enemyActionDurationMs,
        enemyNextActionIndex: state.combat.enemyNextActionIndex,
        enemyCurrentActionId: state.combat.enemyCurrentActionId,
        enemyCurrentStepId: state.combat.enemyCurrentStepId,
        enemyCurrentActionPatternId: state.combat.enemyCurrentActionPatternId,
        enemyActionPatternId: state.combat.enemyActionPatternId,
        playerBasicDamage: 1,
        enemyTiming: null,
        pattern: getEnemyActionPattern(state),
        nextStep: getNextEnemyActionStep(state),
        currentStep: getCurrentEnemyActionStep(state),
        currentAction: getEnemyAction(state, state.combat.enemyCurrentActionId),
      })
      expect(presentation.enemyTimeline).toBeNull()
      expect(presentation.enemyCurrentAction).toBeNull()

      tickStatuses(state, 3_000, executeCombatEffects)
      expect(startNextEnemyAction(state, executeCombatEffects)).toBe(true)
      expect(state.combat.enemyCurrentStepId).not.toBeNull()
    } finally {
      action.effects = originalEffects
    }
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
  it('starts a clean V17 Player Basic cycle under V18 semantics', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 17, combat: { ...initial.combat, active: true, enemyId: 'forest-wisp', playerAttackTimerMs: 500 } })

    expect(migrated.combat.playerAttackDurationMs).toBeGreaterThan(500)
    expect(migrated.combat.playerAttackTimerMs).toBe(migrated.combat.playerAttackDurationMs)
  })

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
