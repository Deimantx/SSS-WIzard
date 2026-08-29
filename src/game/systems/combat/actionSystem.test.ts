import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters/whisperingWoods'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { TRAIT_DEFINITIONS } from '../../content/traits'
import type { CombatActionDefinition, CombatEffect, CombatSource, TraitDefinition, TraitId } from '../../types'
import { executeCombatEffects } from './effectResolver'
import { forceResolveEnemyAction, getCurrentEnemyActionStep, interruptEnemyAction, resolveActiveEnemyAction, scheduleEnemyRecovery, setEnemyActionPattern, startNextEnemyAction } from './actionRuntime'
import { spawnEnemy } from './combatRuntime'
import { applyStatus } from './statusRuntime'
import { migrateSave } from '../../../persistence/migrations'

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
    expect(state.combat.enemyActionRecoveryMs).toBe(2800)
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

  it('allows a Start observer to interrupt and consumes the selected Step', () => {
    const action = emptyAction('start-interrupt', { telegraphMs: 1000 })
    const trait: TraitDefinition = { id: 'interrupt-observer-trait', name: 'Interrupt Observer', description: 'test', rules: [{ id: 'interrupted', event: 'on-action-interrupted', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 3 } }] }] }
    const statusRules = [{ id: 'interrupt-on-start', event: 'on-action-start' as const, condition: { type: 'event-action-is' as const, actionId: action.id }, effects: [{ type: 'interrupt' as const, target: 'opponent' as const }] }]
    withMonsterFixture(action, 'interrupt-pattern', () => withTraitAndStatusRules(trait, statusRules, () => {
      const state = stateWithEnemy()
      applyStatus(state, 'player', 'quickening', { actor: 'player', kind: 'system', sourceId: 'interrupt-test' })
      state.combat.enemyActionTimerMs = 0
      startNextEnemyAction(state, executeCombatEffects)
      expect(state.combat.enemyTelegraphActionId).toBeNull()
      expect(state.combat.enemyActionIndex).toBe(0)
      expect(state.combat.enemyActionTimerMs).toBe(2800)
      expect(state.combat.enemyBarrier).toBe(3)
    }))
  })

  it('does not interrupt an explicitly uninterruptible Action', () => {
    withMonsterFixture(emptyAction('uninterruptible', { interruptible: false, telegraphMs: 1000 }), 'uninterruptible-pattern', () => {
      const state = stateWithEnemy()
      state.combat.enemyActionTimerMs = 0
      startNextEnemyAction(state, executeCombatEffects)
      expect(interruptEnemyAction(state, executeCombatEffects)).toBe(false)
      expect(state.combat.enemyTelegraphActionId).toBe('uninterruptible')
      expect(state.combat.enemyTelegraphMs).toBe(1000)
    })
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

  it('migrates V13 Action runtime fields and old Action sources safely to V14', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 13, combat: { ...initial.combat, active: true, enemyId: 'forest-wisp', enemyTelegraphActionId: 'arc-spark', enemyTelegraphMs: 700, enemyIntervalMs: 2810, playerStatuses: [{ statusId: 'burning', holder: 'player', remainingMs: 1000, stacks: 1, source: { actor: 'enemy', kind: 'special-attack', sourceId: 'arc-spark' } }] } })
    expect(migrated.saveVersion).toBe(14)
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
  })

  it('resolves a direct developer Action through the universal effects pipeline', () => {
    const state = stateWithEnemy('thornling')
    expect(forceResolveEnemyAction(state, 'thorn-lash', executeCombatEffects)).toBe(true)
    expect(state.player.health).toBe(90)
    expect(state.combat.playerStatuses[0].statusId).toBe('thorn-wound')
  })
})
