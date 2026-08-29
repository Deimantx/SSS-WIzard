import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { TRAIT_DEFINITIONS } from '../../content/traits'
import type { CombatActionDefinition, CombatEffect, CombatSource, TraitDefinition, TraitId } from '../../types'
import { executeCombatEffect, executeCombatEffects, resolveBasicAttackInterval } from './effectResolver'
import { clearActiveEnemyAction, forceResolveEnemyAction, getCurrentEnemyActionStep, resetEnemyActionRuntime, resolveActiveEnemyAction, scheduleEnemyRecovery, setEnemyActionPattern, startNextEnemyAction } from './actionRuntime'
import { finishEnemy, resolveCombatDeaths, spawnEnemy } from './combatRuntime'
import { applyStatus, clearStatuses } from './statusRuntime'
import { migrateSave } from '../../../persistence/migrations'
import { advanceGameState } from '../simulation/advanceGameState'
import { advanceWithOfflineBank } from '../offline-bank/offlineBankSimulation'

const stateWithEnemy = (enemyId: Parameters<typeof spawnEnemy>[1] = 'forest-wisp') => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  spawnEnemy(state, enemyId)
  return state
}

const emptyAction = (id: string, overrides: Partial<CombatActionDefinition> = {}): CombatActionDefinition => ({
  id,
  name: id,
  description: id,
  telegraphMs: 100,
  effects: [],
  tags: ['control'],
  ...overrides,
})

const withMonsterFixture = (action: CombatActionDefinition, patternId = 'test-pattern', test: () => void) => {
  const monster = MONSTERS['forest-wisp']
  const originalAction = monster.actions[action.id]
  const originalPattern = monster.actionPatterns[patternId]
  const originalDefault = monster.defaultActionPatternId
  monster.actions[action.id] = action
  monster.actionPatterns[patternId] = { id: patternId, steps: [{ id: `${action.id}-step`, type: 'action', actionId: action.id }] }
  monster.defaultActionPatternId = patternId
  try { test() } finally {
    if (originalAction) monster.actions[action.id] = originalAction
    else delete monster.actions[action.id]
    if (originalPattern) monster.actionPatterns[patternId] = originalPattern
    else delete monster.actionPatterns[patternId]
    monster.defaultActionPatternId = originalDefault
  }
}

const withTraitAndStatusRules = (trait: TraitDefinition, statusRules: NonNullable<typeof STATUS_DEFINITIONS.quickening.triggers>, test: () => void) => {
  const monster = MONSTERS['forest-wisp']
  const traitId = trait.id as TraitId
  const traitRegistry = TRAIT_DEFINITIONS as Record<string, TraitDefinition>
  const previousTrait = traitRegistry[trait.id]
  const previousTraitIds = [...monster.traitIds]
  const previousRules = STATUS_DEFINITIONS.quickening.triggers
  traitRegistry[trait.id] = trait
  monster.traitIds.push(traitId)
  STATUS_DEFINITIONS.quickening.triggers = statusRules
  try { test() } finally {
    monster.traitIds = previousTraitIds
    if (previousTrait) traitRegistry[trait.id] = previousTrait
    else delete traitRegistry[trait.id]
    STATUS_DEFINITIONS.quickening.triggers = previousRules
  }
}

describe('Universal Action System V1', () => {
  it('loops a deterministic pattern and consumes repeated Action references', () => {
    const state = stateWithEnemy()
    const monster = MONSTERS['forest-wisp']
    const originalPattern = monster.actionPatterns.default
    monster.actionPatterns.default = { id: 'default', steps: [{ id: 'x-1', type: 'action', actionId: 'arc-spark' }, { id: 'basic-1', type: 'basic' }, { id: 'x-2', type: 'action', actionId: 'arc-spark' }] }
    try {
      const ids: string[] = []
      for (let index = 0; index < 3; index += 1) {
        ids.push(getCurrentEnemyActionStep(state)?.id ?? '')
        startNextEnemyAction(state, executeCombatEffects)
        state.combat.enemyTelegraphActionId = null
        state.combat.enemyTelegraphStepId = null
      }
      expect(ids).toEqual(['x-1', 'basic-1', 'x-2'])
      expect(getCurrentEnemyActionStep(state)?.id).toBe('x-1')
    } finally { monster.actionPatterns.default = originalPattern }
  })

  it('starts a Telegraph without applying Action effects early, then resolves once', () => {
    const state = stateWithEnemy()
    const action = MONSTERS['forest-wisp'].actions['arc-spark']
    state.combat.enemyActionTimerMs = 0
    startNextEnemyAction(state, executeCombatEffects)
    startNextEnemyAction(state, executeCombatEffects)
    startNextEnemyAction(state, executeCombatEffects)
    expect(state.combat.enemyTelegraphActionId).toBe(action.id)
    expect(state.player.health).toBe(state.player.maxHealth - 10)
    state.combat.enemyTelegraphMs = 1
    resolveActiveEnemyAction(state, executeCombatEffects)
    expect(state.player.health).toBe(state.player.maxHealth - 22)
    expect(state.combat.enemyTelegraphActionId).toBeNull()
    expect(state.combat.enemyActionRecoveryMs).toBe(2380)
  })

  it('resolves zero-Telegraph Actions in Start, Effects, Resolve order', () => {
    withMonsterFixture(emptyAction('instant', { telegraphMs: 0, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 1 } }] }), 'instant-pattern', () => {
      const order: CombatSource['kind'][] = []
      const trait: TraitDefinition = { id: 'instant-order-trait', name: 'Instant Order', description: 'test', rules: [{ id: 'start', event: 'on-action-start', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 1 } }] }, { id: 'resolve', event: 'on-action-resolve', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 1 } }] }] }
      withTraitAndStatusRules(trait, [], () => {
        const state = stateWithEnemy()
        const record: typeof executeCombatEffects = (current, effects, source, depth) => { order.push(source.kind); executeCombatEffects(current, effects, source, depth) }
        state.combat.enemyActionTimerMs = 0
        startNextEnemyAction(state, record)
        expect(order).toEqual(['trait', 'action', 'trait'])
        expect(state.combat.enemyBarrier).toBe(3)
        expect(state.combat.enemyActionRecoveryMs).toBe(2800)
      })
    })
  })

  it('routes Action events to source actor before opponent using live state', () => {
    const trait: TraitDefinition = { id: 'action-observer-trait', name: 'Action Observer', description: 'test', rules: [{ id: 'self-start', event: 'on-action-start', condition: { type: 'all', conditions: [{ type: 'source-is-self' }, { type: 'event-action-is', actionId: 'observed' }, { type: 'event-action-has-tag', tag: 'control' }] }, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 1 } }] }] }
    const statusRules = [{ id: 'opponent-start', event: 'on-action-start' as const, condition: { type: 'all' as const, conditions: [{ type: 'source-is-opponent' as const }, { type: 'target-has-barrier' as const }] }, effects: [{ type: 'gain-barrier' as const, target: 'self' as const, magnitude: { type: 'flat' as const, value: 2 } }] }]
    withMonsterFixture(emptyAction('observed'), 'observed-pattern', () => withTraitAndStatusRules(trait, statusRules, () => {
      const state = stateWithEnemy()
      applyStatus(state, 'player', 'quickening', { actor: 'player', kind: 'system', sourceId: 'observer-test' })
      state.combat.enemyActionTimerMs = 0
      startNextEnemyAction(state, executeCombatEffects)
      expect(state.combat.enemyBarrier).toBe(1)
      expect(state.combat.playerBarrier).toBe(2)
    }))
  })

  it('uses Action recovery overrides and Action Speed without shortening Telegraphs', () => {
    withMonsterFixture(emptyAction('quick-action', { recoveryMs: 4000, telegraphMs: 1200 }), 'quick-pattern', () => {
      const state = stateWithEnemy()
      state.combat.enemyActionTimerMs = 0
      startNextEnemyAction(state, executeCombatEffects)
      expect(state.combat.enemyTelegraphMs).toBe(1200)
      resolveActiveEnemyAction(state, executeCombatEffects)
      expect(state.combat.enemyActionRecoveryMs).toBe(4000)
      applyStatus(state, 'enemy', 'haste', { actor: 'enemy', kind: 'system', sourceId: 'speed-test' })
      scheduleEnemyRecovery(state, 4000)
      expect(state.combat.enemyActionRecoveryMs).toBe(3400)
    })
  })

  it('switches Pattern index immediately while preserving an active Telegraph', () => {
    withMonsterFixture(emptyAction('phase-a', { telegraphMs: 1000 }), 'default', () => {
      const monster = MONSTERS['forest-wisp']
      const previous = monster.actionPatterns.enraged
      monster.actions['phase-b'] = emptyAction('phase-b', { telegraphMs: 0 })
      monster.actionPatterns.enraged = { id: 'enraged', steps: [{ id: 'phase-b-step', type: 'action', actionId: 'phase-b' }] }
      try {
        const state = stateWithEnemy()
        state.combat.enemyActionTimerMs = 0
        startNextEnemyAction(state, executeCombatEffects)
        setEnemyActionPattern(state, 'enraged')
        expect(state.combat.enemyTelegraphActionId).toBe('phase-a')
        expect(state.combat.enemyActionPatternId).toBe('enraged')
        resolveActiveEnemyAction(state, executeCombatEffects)
        expect(state.combat.enemyActionIndex).toBe(0)
        state.combat.enemyActionTimerMs = 0
        startNextEnemyAction(state, executeCombatEffects)
        expect(state.combat.enemyTelegraphActionId).toBeNull()
      } finally {
        if (previous) monster.actionPatterns.enraged = previous
        else delete monster.actionPatterns.enraged
        delete monster.actions['phase-b']
      }
    })
  })

  it('commits an Action before impacts so every authored effect resolves', () => {
    const action = emptyAction('double-hit', { telegraphMs: 100, effects: [
      { type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: 1 } },
      { type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: 1 } },
    ] })
    const trait: TraitDefinition = { id: 'resolve-commit-trait', name: 'Resolve Commit', description: 'test', rules: [
      { id: 'resolved', event: 'on-action-resolve', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 1 } }] },
    ] }
    withMonsterFixture(action, 'commit-pattern', () => withTraitAndStatusRules(trait, [], () => {
      const state = stateWithEnemy()
      applyStatus(state, 'player', 'quickening', { actor: 'player', kind: 'system', sourceId: 'commit-test' })
      state.combat.enemyActionTimerMs = 0
      startNextEnemyAction(state, executeCombatEffects)
      resolveActiveEnemyAction(state, executeCombatEffects)
      expect(state.player.health).toBe(state.player.maxHealth - 2)
      expect(state.combat.enemyBarrier).toBe(1)
      expect(state.combat.enemyTelegraphActionId).toBeNull()
      expect(state.combat.enemyActionRecoveryMs).toBe(2800)
    }))
  })

  it('does not re-enter a committed Action when an impact changes the current timer', () => {
    const action = emptyAction('timer-impact', { telegraphMs: 100, effects: [
      { type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: 1 } },
      { type: 'modify-action-timer', target: 'self', action: 'current', amountMs: -500 },
      { type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: 1 } },
    ] })
    const trait: TraitDefinition = { id: 'timer-impact-trait', name: 'Timer Impact', description: 'test', rules: [{ id: 'resolved', event: 'on-action-resolve', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 1 } }] }] }
    withMonsterFixture(action, 'timer-impact-pattern', () => withTraitAndStatusRules(trait, [], () => {
      const state = stateWithEnemy()
      state.combat.enemyActionTimerMs = 0
      startNextEnemyAction(state, executeCombatEffects)
      resolveActiveEnemyAction(state, executeCombatEffects)
      expect(state.player.health).toBe(state.player.maxHealth - 2)
      expect(state.combat.enemyBarrier).toBe(1)
      expect(state.combat.enemyTelegraphActionId).toBeNull()
    }))
  })

  it('preserves Action origin Pattern through switching and resolve', () => {
    withMonsterFixture(emptyAction('origin-action', { telegraphMs: 1000 }), 'default', () => {
      const monster = MONSTERS['forest-wisp']
      const previousPattern = monster.actionPatterns.enraged
      monster.actionPatterns.enraged = { id: 'enraged', steps: [{ id: 'enraged-step', type: 'action', actionId: 'origin-action' }] }
      try {
        const resolved = stateWithEnemy()
        resolved.combat.enemyActionTimerMs = 0
        startNextEnemyAction(resolved, executeCombatEffects)
        expect(resolved.combat.enemyTelegraphPatternId).toBe('default')
        setEnemyActionPattern(resolved, 'enraged')
        resolveActiveEnemyAction(resolved, executeCombatEffects)
        expect(resolved.combat.enemyActionPatternId).toBe('enraged')
        expect(resolved.combat.enemyTelegraphPatternId).toBeNull()

      } finally {
        if (previousPattern) monster.actionPatterns.enraged = previousPattern
        else delete monster.actionPatterns.enraged
      }
    })
  })

  it('applies combat-start Action Speed modifiers before the first Recovery is scheduled', () => {
    const hasteTrait: TraitDefinition = { id: 'combat-start-haste-trait', name: 'Combat Start Haste', description: 'test', rules: [{ id: 'haste', event: 'on-combat-start', effects: [{ type: 'apply-status', target: 'self', statusId: 'haste' }] }] }
    const chilledTrait: TraitDefinition = { id: 'combat-start-chilled-trait', name: 'Combat Start Chilled', description: 'test', rules: [{ id: 'chilled', event: 'on-combat-start', effects: [{ type: 'apply-status', target: 'self', statusId: 'chilled' }] }] }
    withTraitAndStatusRules(hasteTrait, [], () => {
      expect(stateWithEnemy().combat.enemyActionRecoveryMs).toBe(2380)
    })
    withTraitAndStatusRules(chilledTrait, [], () => {
      expect(stateWithEnemy().combat.enemyActionRecoveryMs).toBe(3360)
    })
  })

  it('keeps nested Action lifecycle depth instead of resetting to zero', () => {
    withMonsterFixture(emptyAction('depth-action', { telegraphMs: 100 }), 'depth-pattern', () => {
      const state = stateWithEnemy()
      state.combat.enemyActionTimerMs = 0
      startNextEnemyAction(state, executeCombatEffects)
      const actionDepths: number[] = []
      const execute = (current: typeof state, effects: CombatEffect[], source: CombatSource, depth = 0) => {
        if (source.kind === 'action') actionDepths.push(depth)
        executeCombatEffects(current, effects, source, depth)
      }
      executeCombatEffect(state, { type: 'modify-action-timer', target: 'opponent', action: 'current', amountMs: -500 }, { actor: 'player', kind: 'spell', sourceId: 'depth-test' }, 6, execute)
      expect(actionDepths).toEqual([7])
    })
  })

  it('keeps Action lifecycle context target-neutral', () => {
    const action = emptyAction('self-context', { telegraphMs: 0, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 1 } }] })
    withMonsterFixture(action, 'self-context-pattern', () => {
      const state = stateWithEnemy()
      const contexts: Array<Record<string, unknown>> = []
      const trait: TraitDefinition = { id: 'context-inspector-trait', name: 'Context Inspector', description: 'test', rules: [{ id: 'resolve', event: 'on-action-resolve', effects: [] }] }
      withTraitAndStatusRules(trait, [], () => {
        state.combat.enemyActionTimerMs = 0
        startNextEnemyAction(state, (current, effects, source, depth) => {
          if (source.kind === 'action') contexts.push({ source, depth })
          executeCombatEffects(current, effects, source, depth)
        })
      })
      expect(contexts).toHaveLength(1)
    })
  })

  it('keeps Chilled scoped to Basic Attack and Action cadence without changing Telegraphs', () => {
    const state = stateWithEnemy()
    applyStatus(state, 'player', 'chilled', { actor: 'enemy', kind: 'action', sourceId: 'chill' })
    applyStatus(state, 'enemy', 'chilled', { actor: 'player', kind: 'spell', sourceId: 'chill' })
    expect(resolveBasicAttackInterval(state, 'player', 1200)).toBe(1440)
    expect(scheduleEnemyRecovery(state, 2500)).toBe(3000)
    state.combat.enemyActionTimerMs = 0
    startNextEnemyAction(state, executeCombatEffects)
    startNextEnemyAction(state, executeCombatEffects)
    startNextEnemyAction(state, executeCombatEffects)
    expect(state.combat.enemyTelegraphMs).toBe(2000)
  })

  it('pauses Telegraph and Recovery while the enemy is Stunned', () => {
    const telegraph = stateWithEnemy()
    telegraph.combat.enemyActionTimerMs = 0
    startNextEnemyAction(telegraph, executeCombatEffects)
    startNextEnemyAction(telegraph, executeCombatEffects)
    startNextEnemyAction(telegraph, executeCombatEffects)
    applyStatus(telegraph, 'enemy', 'stunned', { actor: 'player', kind: 'spell', sourceId: 'stun' })
    advanceGameState(telegraph, 1000)
    expect(telegraph.combat.enemyTelegraphMs).toBe(2000)
    clearStatuses(telegraph, 'enemy')
    advanceGameState(telegraph, 500)
    expect(telegraph.combat.enemyTelegraphMs).toBe(1500)

    const recovery = stateWithEnemy()
    recovery.combat.enemyActionTimerMs = 1500
    recovery.combat.enemyActionRecoveryMs = 1500
    applyStatus(recovery, 'enemy', 'stunned', { actor: 'player', kind: 'spell', sourceId: 'stun' })
    advanceGameState(recovery, 1000)
    expect(recovery.combat.enemyActionTimerMs).toBe(1500)
    clearStatuses(recovery, 'enemy')
    advanceGameState(recovery, 500)
    expect(recovery.combat.enemyActionTimerMs).toBe(1000)
  })

  it('delays the active Telegraph or Recovery and resolves acceleration exactly once', () => {
    const state = stateWithEnemy()
    state.combat.enemyActionTimerMs = 0
    startNextEnemyAction(state, executeCombatEffects)
    startNextEnemyAction(state, executeCombatEffects)
    startNextEnemyAction(state, executeCombatEffects)
    executeCombatEffects(state, [{ type: 'modify-action-timer', target: 'opponent', action: 'current', amountMs: 500 }], { actor: 'player', kind: 'spell', sourceId: 'delay' })
    expect(state.combat.enemyTelegraphMs).toBe(2500)

    clearActiveEnemyAction(state)
    state.combat.enemyActionTimerMs = 2000
    state.combat.enemyActionRecoveryMs = 2000
    executeCombatEffects(state, [{ type: 'modify-action-timer', target: 'opponent', action: 'current', amountMs: 500 }], { actor: 'player', kind: 'spell', sourceId: 'delay' })
    expect(state.combat.enemyActionTimerMs).toBe(2500)

    withMonsterFixture(emptyAction('accelerate', { telegraphMs: 200 }), 'accelerate-pattern', () => {
      const accelerating = stateWithEnemy()
      accelerating.combat.enemyActionTimerMs = 0
      startNextEnemyAction(accelerating, executeCombatEffects)
      executeCombatEffects(accelerating, [{ type: 'modify-action-timer', target: 'opponent', action: 'current', amountMs: -500 }], { actor: 'player', kind: 'spell', sourceId: 'accelerate' })
      expect(accelerating.combat.enemyTelegraphActionId).toBeNull()
      expect(accelerating.combat.enemyActionRecoveryMs).toBe(2800)
    })
  })

  it('cleans administrative combat state after an active Action', () => {
    const cases = [
      () => { const state = stateWithEnemy(); state.combat.enemyActionTimerMs = 0; startNextEnemyAction(state, executeCombatEffects); startNextEnemyAction(state, executeCombatEffects); startNextEnemyAction(state, executeCombatEffects); resetEnemyActionRuntime(state); return state },
      () => { const state = stateWithEnemy(); state.combat.enemyActionTimerMs = 0; startNextEnemyAction(state, executeCombatEffects); startNextEnemyAction(state, executeCombatEffects); startNextEnemyAction(state, executeCombatEffects); finishEnemy(state); return state },
      () => { const state = stateWithEnemy(); state.combat.enemyActionTimerMs = 0; startNextEnemyAction(state, executeCombatEffects); startNextEnemyAction(state, executeCombatEffects); startNextEnemyAction(state, executeCombatEffects); state.player.health = 0; resolveCombatDeaths(state); return state },
    ]
    cases.forEach((create) => {
      const state = create()
      expect(state.combat.log.some((entry) => entry.includes('cancelled'))).toBe(false)
      expect(state.combat.enemyTelegraphActionId).toBeNull()
      expect(state.combat.enemyTelegraphPatternId).toBeNull()
    })
  })

  it('keeps live and Offline Bank combat simulation on the same Action path', async () => {
    const offline = stateWithEnemy()
    offline.offlineBankMs = 4000
    const live = JSON.parse(JSON.stringify(offline)) as typeof offline
    for (let index = 0; index < 4; index += 1) advanceGameState(live, 1000, { mode: 'live' })
    const result = await advanceWithOfflineBank(4000, () => offline, (recipe) => recipe(offline), () => undefined)
    expect(result.ok).toBe(true)
    const snapshot = (state: typeof offline) => ({
      pattern: state.combat.enemyActionPatternId,
      index: state.combat.enemyActionIndex,
      action: state.combat.enemyTelegraphActionId,
      telegraph: state.combat.enemyTelegraphMs,
      recovery: state.combat.enemyActionTimerMs,
      playerHp: state.player.health,
      enemyHp: state.combat.enemyHp,
      playerBarrier: state.combat.playerBarrier,
      enemyBarrier: state.combat.enemyBarrier,
      playerStatuses: state.combat.playerStatuses,
      enemyStatuses: state.combat.enemyStatuses,
    })
    expect(snapshot(offline)).toEqual(snapshot(live))
  })

  it('locks the current Whispering Woods Patterns and Action payloads', () => {
    const labels = (id: keyof typeof MONSTERS) => MONSTERS[id].actionPatterns.default.steps.map((step) => step.type === 'basic' ? 'Basic' : MONSTERS[id].actions[step.actionId].name)
    expect(labels('forest-wisp')).toEqual(['Basic', 'Basic', 'Arc Spark'])
    expect(labels('thornling')).toEqual(['Basic', 'Basic', 'Thorn Lash'])
    expect(labels('stone-root')).toEqual(['Basic', 'Basic', 'Basic', 'Root Slam'])
    expect(labels('grove-sentinel')).toEqual(['Basic', 'Basic', 'Root Crush', 'Basic', 'Verdant Guard'])
    expect(labels('forest-heart')).toEqual(['Basic', 'Basic', 'Heart Pulse', 'Basic', 'Basic', 'Root Prison', 'Basic', 'Basic', 'Basic', 'Rejuvenating Sap'])
    const action = (monster: keyof typeof MONSTERS, actionId: string) => MONSTERS[monster].actions[actionId]
    expect(action('forest-wisp', 'arc-spark')).toMatchObject({ telegraphMs: 2000, effects: [expect.objectContaining({ damageType: 'arcane', magnitude: { type: 'flat', value: 12 } })] })
    expect(action('thornling', 'thorn-lash')).toMatchObject({ telegraphMs: 1800, effects: [expect.objectContaining({ damageType: 'physical', magnitude: { type: 'flat', value: 10 } }), expect.objectContaining({ type: 'apply-status', statusId: 'thorn-wound' })] })
    expect(action('stone-root', 'root-slam')).toMatchObject({ telegraphMs: 2500, effects: [expect.objectContaining({ magnitude: { type: 'flat', value: 18 } }), expect.objectContaining({ type: 'modify-action-timer', amountMs: 700 })] })
    expect(action('grove-sentinel', 'root-crush')).toMatchObject({ telegraphMs: 2000, effects: [expect.objectContaining({ magnitude: { type: 'flat', value: 20 } })] })
    expect(action('grove-sentinel', 'verdant-guard')).toMatchObject({ telegraphMs: 2500, effects: [expect.objectContaining({ type: 'gain-barrier', magnitude: { type: 'flat', value: 60 } })] })
    expect(action('forest-heart', 'heart-pulse')).toMatchObject({ telegraphMs: 2000, effects: [expect.objectContaining({ magnitude: { type: 'flat', value: 24 } })] })
    expect(action('forest-heart', 'root-prison')).toMatchObject({ telegraphMs: 2000, effects: [expect.objectContaining({ magnitude: { type: 'flat', value: 16 } }), expect.objectContaining({ type: 'modify-action-timer', amountMs: 1000 })] })
    expect(action('forest-heart', 'rejuvenating-sap')).toMatchObject({ telegraphMs: 3000, effects: [expect.objectContaining({ type: 'heal', magnitude: { type: 'flat', value: 60 } })] })
  })

  it('migrates V13 Action runtime fields and old Action sources safely to V15', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 13, combat: { ...initial.combat, active: true, enemyId: 'forest-wisp', enemyTelegraphActionId: 'arc-spark', enemyTelegraphMs: 700, enemyIntervalMs: 2810, playerStatuses: [{ statusId: 'burning', holder: 'player', remainingMs: 1000, stacks: 1, source: { actor: 'enemy', kind: 'special-attack', sourceId: 'arc-spark' } }] } })
    expect(migrated.saveVersion).toBe(15)
    expect(migrated.combat.enemyActionPatternId).toBe('default')
    expect(migrated.combat.enemyActionRecoveryMs).toBe(2810)
    expect(migrated.combat.enemyTelegraphActionId).toBe('arc-spark')
    expect(migrated.combat.enemyTelegraphMs).toBe(700)
    expect(migrated.combat.enemyTelegraphStepId).toBeNull()
    expect(migrated.combat.playerStatuses[0].source.kind).toBe('action')
  })

  it('falls back from invalid saved Pattern and active Action without crashing', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 14, combat: { ...initial.combat, active: true, enemyId: 'forest-wisp', enemyActionPatternId: 'removed', enemyActionIndex: 99, enemyTelegraphActionId: 'removed', enemyTelegraphMs: 500 } })
    expect(migrated.combat.enemyActionPatternId).toBe('default')
    expect(migrated.combat.enemyActionIndex).toBe(0)
    expect(migrated.combat.enemyTelegraphActionId).toBeNull()
    expect(migrated.combat.enemyTelegraphStepId).toBeNull()
    expect(migrated.combat.enemyTelegraphPatternId).toBeNull()
  })

  it('migrates V14 Action origin when the current Pattern and Step prove it', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 14, combat: { ...initial.combat, active: true, enemyId: 'forest-wisp', enemyActionPatternId: 'default', enemyTelegraphActionId: 'arc-spark', enemyTelegraphMs: 700, enemyTelegraphStepId: 'arc-spark-step' } })
    expect(migrated.saveVersion).toBe(15)
    expect(migrated.combat.enemyTelegraphPatternId).toBe('default')
    expect(migrated.combat.enemyTelegraphStepId).toBe('arc-spark-step')
  })

  it('sanitizes invalid V15 Action origin while preserving a valid active Action fallback', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 15, combat: { ...initial.combat, active: true, enemyId: 'forest-wisp', enemyActionPatternId: 'default', enemyTelegraphActionId: 'arc-spark', enemyTelegraphMs: 700, enemyTelegraphStepId: 'arc-spark-step', enemyTelegraphPatternId: 'missing-pattern' } })
    expect(migrated.combat.enemyTelegraphActionId).toBe('arc-spark')
    expect(migrated.combat.enemyTelegraphPatternId).toBeNull()
    expect(migrated.combat.enemyTelegraphStepId).toBe('arc-spark-step')
  })

  it('resolves a direct developer Action through the universal effects pipeline', () => {
    const state = stateWithEnemy('thornling')
    expect(forceResolveEnemyAction(state, 'thorn-lash', executeCombatEffects)).toBe(true)
    expect(state.player.health).toBe(90)
    expect(state.combat.playerStatuses[0].statusId).toBe('thorn-wound')
  })
})
