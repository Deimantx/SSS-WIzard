import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { migrateSave } from '../../../persistence/migrations'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { TRAIT_DEFINITIONS, validateTraitDefinitions } from '../../content/traits'
import { MONSTERS } from '../../content/monsters/whisperingWoods'
import { validateMonsterDefinitions } from '../../content/monsters/whisperingWoods'
import type { CombatEffect, CombatSource, TraitDefinition, TraitId } from '../../types'
import { executeCombatEffects, damageEnemy, damagePlayer } from './effectResolver'
import { getCombatModifiers } from './modifiers'
import { applyStatus, removeStatus, tickStatuses } from './statusRuntime'
import { conditionContainsCrossedHpThreshold, evaluateCombatCondition } from './conditionRuntime'
import { resetCombatRuleRuntime, runCombatTriggers, tickRuleCooldowns } from './triggerRuntime'
import { spawnEnemy } from './combatRuntime'

const playerSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'trait-test', tags: ['spell', 'fire'] }
const enemySource: CombatSource = { actor: 'enemy', kind: 'basic-attack', sourceId: 'trait-test-attack', tags: ['basic-attack', 'direct'] }

const stateWithEnemy = () => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  spawnEnemy(state, 'forest-wisp')
  return state
}

const withTemporaryTrait = (trait: TraitDefinition, test: () => void) => {
  const monster = MONSTERS['forest-wisp']
  const traitId = trait.id as TraitId
  const registry = TRAIT_DEFINITIONS as Record<string, TraitDefinition>
  const original = registry[trait.id]
  registry[trait.id] = trait
  monster.traitIds.push(traitId)
  try { test() } finally {
    monster.traitIds.pop()
    if (original) registry[trait.id] = original
    else delete registry[trait.id]
  }
}

describe('Universal Trait System V1', () => {
  it('evaluates conditional Trait modifiers through the canonical combat pipeline', () => {
    withTemporaryTrait({
      id: 'test-predator', name: 'Predator', description: 'Test.',
      modifiers: [{ key: 'damage-dealt-percent', value: 0.2, condition: { type: 'target-hp-below-percent', percent: 30 } }],
    }, () => {
      const state = stateWithEnemy()
      const context = { sourceTags: ['spell' as const], damageType: 'fire' as const }
      expect(getCombatModifiers(state, 'enemy', 'damage-dealt-percent', context)).toBe(0)
      state.player.health = 10
      expect(getCombatModifiers(state, 'enemy', 'damage-dealt-percent', context)).toBe(0.2)
    })
  })

  it('supports nested conditions, source tags, explicit stack ownership, and Barrier amounts', () => {
    const state = stateWithEnemy()
    applyStatus(state, 'enemy', 'shock', playerSource, { stacks: 3 })
    applyStatus(state, 'player', 'shock', playerSource, { stacks: 3 })
    state.combat.enemyBarrier = 20
    const condition = {
      type: 'all' as const,
      conditions: [
        { type: 'self-status-stacks-at-least' as const, statusId: 'shock' as const, stacks: 3 },
        { type: 'self-barrier-at-least' as const, value: 20 },
        { type: 'source-has-tag' as const, tag: 'fire' as const },
        { type: 'not' as const, condition: { type: 'target-barrier-at-least' as const, value: 1 } },
      ],
    }
    expect(evaluateCombatCondition(state, 'enemy', condition, { source: playerSource })).toBe(true)
    expect(evaluateCombatCondition(state, 'enemy', { type: 'target-status-stacks-at-least', statusId: 'shock', stacks: 3 }, {})).toBe(true)
    expect(evaluateCombatCondition(state, 'enemy', { type: 'self-barrier-at-most', value: 19 }, {})).toBe(false)
    expect(evaluateCombatCondition(state, 'enemy', { type: 'any', conditions: [{ type: 'self-hp-above-percent', percent: 100 }, { type: 'self-barrier-at-least', value: 20 }] }, {})).toBe(true)
  })

  it('supports downward and upward threshold crossings, including target ownership', () => {
    const downward = { type: 'self-hp-below-percent' as const, percent: 40 }
    expect(conditionContainsCrossedHpThreshold('enemy', downward, { changedActor: 'enemy', previousHpPercent: 41, currentHpPercent: 39 })).toBe(true)
    expect(conditionContainsCrossedHpThreshold('enemy', downward, { changedActor: 'enemy', previousHpPercent: 39, currentHpPercent: 30 })).toBe(false)
    expect(conditionContainsCrossedHpThreshold('enemy', { type: 'self-hp-above-percent', percent: 40 }, { changedActor: 'enemy', previousHpPercent: 39, currentHpPercent: 41 })).toBe(true)
    expect(conditionContainsCrossedHpThreshold('enemy', { type: 'target-hp-below-percent', percent: 40 }, { changedActor: 'player', previousHpPercent: 41, currentHpPercent: 39 })).toBe(true)
    const notBelow = { type: 'not' as const, condition: downward }
    expect(conditionContainsCrossedHpThreshold('enemy', notBelow, { changedActor: 'enemy', previousHpPercent: 39, currentHpPercent: 41 })).toBe(true)
    expect(conditionContainsCrossedHpThreshold('enemy', notBelow, { changedActor: 'enemy', previousHpPercent: 41, currentHpPercent: 39 })).toBe(false)
    expect(conditionContainsCrossedHpThreshold('enemy', { type: 'not', condition: { type: 'self-hp-above-percent', percent: 40 } }, { changedActor: 'enemy', previousHpPercent: 41, currentHpPercent: 39 })).toBe(true)
    expect(conditionContainsCrossedHpThreshold('enemy', { type: 'not', condition: notBelow }, { changedActor: 'enemy', previousHpPercent: 41, currentHpPercent: 39 })).toBe(true)
    expect(conditionContainsCrossedHpThreshold('enemy', { type: 'all', conditions: [notBelow, { type: 'any', conditions: [notBelow, { type: 'self-hp-below-percent', percent: 10 }] }] }, { changedActor: 'enemy', previousHpPercent: 39, currentHpPercent: 41 })).toBe(true)

    withTemporaryTrait({
      id: 'test-target-threshold', name: 'Target Threshold', description: 'Test.',
      rules: [{ id: 'target-threshold', event: 'on-hp-threshold', condition: { type: 'target-hp-below-percent', percent: 50 }, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 7 } }] }],
    }, () => {
      const state = stateWithEnemy()
      state.player.health = 60
      damagePlayer(state, 20, enemySource)
      expect(state.combat.enemyBarrier).toBe(7)
    })
  })

  it('starts cooldown before effects and ticks it only in an active encounter', () => {
    withTemporaryTrait({
      id: 'test-cooldown', name: 'Cooldown', description: 'Test.',
      rules: [{ id: 'barrier-loop', event: 'on-barrier-gained', cooldownMs: 3000, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 5 } }] }],
    }, () => {
      const state = stateWithEnemy()
      const effect: CombatEffect = { type: 'gain-barrier', target: 'opponent', magnitude: { type: 'flat', value: 5 } }
      executeCombatEffects(state, [effect], playerSource)
      expect(state.combat.enemyBarrier).toBe(10)
      expect(state.combat.ruleCooldowns['enemy:trait:test-cooldown:barrier-loop']).toBe(3000)
      executeCombatEffects(state, [effect], playerSource)
      expect(state.combat.enemyBarrier).toBe(15)
      tickRuleCooldowns(state, 2999)
      executeCombatEffects(state, [effect], playerSource)
      expect(state.combat.enemyBarrier).toBe(20)
      tickRuleCooldowns(state, 1)
      executeCombatEffects(state, [effect], playerSource)
      expect(state.combat.enemyBarrier).toBe(30)
      state.combat.enemyId = null
      tickRuleCooldowns(state, 10000)
      expect(state.combat.ruleCooldowns['enemy:trait:test-cooldown:barrier-loop']).toBe(3000)
    })
  })

  it('runs same-event rules by priority against live state', () => {
    withTemporaryTrait({
      id: 'test-order', name: 'Order', description: 'Test.',
      rules: [
        { id: 'late', event: 'on-combat-start', priority: 10, condition: { type: 'self-has-barrier' }, effects: [{ type: 'apply-status', target: 'self', statusId: 'fortified' }] },
        { id: 'early', event: 'on-combat-start', priority: -10, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 3 } }] },
      ],
    }, () => {
      const state = stateWithEnemy()
      state.combat.enemyBarrier = 0
      resetCombatRuleRuntime(state)
      runCombatTriggers(state, 'enemy', 'on-combat-start', { eventTarget: 'player' }, executeCombatEffects)
      expect(state.combat.enemyBarrier).toBe(3)
      expect(state.combat.enemyStatuses.some((status) => status.statusId === 'fortified')).toBe(true)
    })
  })

  it('preserves authored order for equal-priority rules', () => {
    withTemporaryTrait({
      id: 'test-equal-priority', name: 'Equal Priority', description: 'Test.',
      rules: [
        { id: 'gain-first', event: 'on-damage-taken', priority: 0, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 3 } }] },
        { id: 'observe-second', event: 'on-damage-taken', priority: 0, condition: { type: 'self-has-barrier' }, effects: [{ type: 'apply-status', target: 'self', statusId: 'fortified' }] },
      ],
    }, () => {
      const state = stateWithEnemy()
      damageEnemy(state, 1, 'spell')
      expect(state.combat.enemyBarrier).toBe(3)
      expect(state.combat.enemyStatuses.some((status) => status.statusId === 'fortified')).toBe(true)
    })
  })

  it('does not start a cooldown when an event condition fails', () => {
    withTemporaryTrait({
      id: 'test-conditional-cooldown', name: 'Conditional Cooldown', description: 'Test.',
      rules: [{ id: 'fire-only', event: 'on-damage-taken', condition: { type: 'source-has-tag', tag: 'fire' }, cooldownMs: 3000, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 2 } }] }],
    }, () => {
      const state = stateWithEnemy()
      const key = 'enemy:trait:test-conditional-cooldown:fire-only'
      damageEnemy(state, 1, 'spell')
      expect(state.combat.enemyBarrier).toBe(0)
      expect(state.combat.ruleCooldowns[key] ?? 0).toBe(0)
      executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', damageType: 'fire', magnitude: { type: 'flat', value: 1 } }], playerSource)
      expect(state.combat.enemyBarrier).toBe(2)
      expect(state.combat.ruleCooldowns[key]).toBe(3000)
    })
  })

  it('emits heal-received and barrier-gained with actual values', () => {
    withTemporaryTrait({
      id: 'test-events', name: 'Events', description: 'Test.',
      rules: [
        { id: 'healed', event: 'on-heal-received', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 4 } }] },
        { id: 'barrier', event: 'on-barrier-gained', effects: [{ type: 'apply-status', target: 'self', statusId: 'fortified' }] },
      ],
    }, () => {
      const state = stateWithEnemy()
      state.combat.enemyHp = 20
      executeCombatEffects(state, [{ type: 'heal', target: 'opponent', magnitude: { type: 'flat', value: 100 } }], playerSource)
      expect(state.combat.enemyHp).toBe(44)
      expect(state.combat.enemyBarrier).toBe(4)
      expect(state.combat.enemyStatuses.some((status) => status.statusId === 'fortified')).toBe(true)
      executeCombatEffects(state, [{ type: 'gain-barrier', target: 'opponent', magnitude: { type: 'flat', value: 2 }, mode: 'replace', durationMs: null }], playerSource)
      expect(state.combat.enemyBarrier).toBe(2)
      expect(state.combat.enemyStatuses.filter((status) => status.statusId === 'fortified')).toHaveLength(1)
    })
  })

  it('keeps lifecycle Status identity separate from remover source tags', () => {
    withTemporaryTrait({
      id: 'test-lifecycle-context', name: 'Lifecycle Context', description: 'Test.',
      rules: [
        { id: 'source-fire', event: 'on-status-removed', condition: { type: 'source-has-tag', tag: 'fire' }, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 5 } }] },
        { id: 'status-fire', event: 'on-status-removed', condition: { type: 'event-status-has-tag', tag: 'fire' }, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 7 } }] },
        { id: 'fortified-only', event: 'on-status-removed', condition: { type: 'event-status-is', statusId: 'fortified' }, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 11 } }] },
      ],
    }, () => {
      const state = stateWithEnemy()
      applyStatus(state, 'enemy', 'burning', enemySource)
      applyStatus(state, 'enemy', 'fortified', enemySource)
      removeStatus(state, 'enemy', 'burning', { executeEffects: executeCombatEffects, source: enemySource })
      expect(state.combat.enemyBarrier).toBe(7)
      removeStatus(state, 'enemy', 'fortified', { executeEffects: executeCombatEffects, source: playerSource })
      expect(state.combat.enemyBarrier).toBe(23)
    })
  })

  it('matches a specific Status on expiry and not other Status expiries', () => {
    withTemporaryTrait({
      id: 'test-expiry-context', name: 'Expiry Context', description: 'Test.',
      rules: [{ id: 'quickening-expired', event: 'on-status-expired', condition: { type: 'event-status-is', statusId: 'quickening' }, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 6 } }] }],
    }, () => {
      const state = stateWithEnemy()
      applyStatus(state, 'enemy', 'quickening', enemySource, { durationMs: 1 })
      tickStatuses(state, 1, executeCombatEffects)
      expect(state.combat.enemyBarrier).toBe(6)
      applyStatus(state, 'enemy', 'fortified', enemySource, { durationMs: 1 })
      tickStatuses(state, 1, executeCombatEffects)
      expect(state.combat.enemyBarrier).toBe(6)
    })
  })

  it('distinguishes explicit removal from expiry and lets the removed Status own the rule', () => {
    const original = STATUS_DEFINITIONS.quickening.triggers
    STATUS_DEFINITIONS.quickening.triggers = [
      { id: 'test-removed', event: 'on-status-removed', effects: [{ type: 'apply-status', target: 'self', statusId: 'fortified' }] },
      { id: 'test-expired', event: 'on-status-expired', effects: [{ type: 'apply-status', target: 'self', statusId: 'haste' }] },
    ]
    try {
      const state = stateWithEnemy()
      applyStatus(state, 'player', 'quickening', playerSource)
      expect(removeStatus(state, 'player', 'quickening', { executeEffects: executeCombatEffects, source: playerSource })).toBe(true)
      expect(state.combat.playerStatuses.some((status) => status.statusId === 'fortified')).toBe(true)
      expect(state.combat.playerStatuses.some((status) => status.statusId === 'haste')).toBe(false)

      const expiryState = stateWithEnemy()
      applyStatus(expiryState, 'player', 'quickening', playerSource, { durationMs: 1 })
      tickStatuses(expiryState, 1, executeCombatEffects)
      expect(expiryState.combat.playerStatuses.some((status) => status.statusId === 'haste')).toBe(true)
      expect(expiryState.combat.playerStatuses.some((status) => status.statusId === 'fortified')).toBe(false)
    } finally { STATUS_DEFINITIONS.quickening.triggers = original }
  })

  it('runs expiry rules after removal and preserves a reapplication made by that rule', () => {
    const original = STATUS_DEFINITIONS.quickening.triggers
    STATUS_DEFINITIONS.quickening.triggers = [{ id: 'test-expired', event: 'on-status-expired', effects: [{ type: 'apply-status', target: 'self', statusId: 'quickening' }] }]
    try {
      const state = stateWithEnemy()
      applyStatus(state, 'player', 'quickening', playerSource, { durationMs: 1 })
      tickStatuses(state, 1, executeCombatEffects)
      expect(state.combat.playerStatuses).toHaveLength(1)
      expect(state.combat.playerStatuses[0].statusId).toBe('quickening')
      expect(state.combat.playerStatuses[0].remainingMs).toBe(6000)
    } finally { STATUS_DEFINITIONS.quickening.triggers = original }
  })

  it('sanitizes V13 rule cooldowns and upgrades V12 saves without losing runtime state', () => {
    const initial = createInitialState()
    const v12 = migrateSave({ ...initial, saveVersion: 12, combat: { ...initial.combat, ruleCooldowns: undefined } })
    expect(v12.saveVersion).toBe(15)
    expect(v12.combat.ruleCooldowns).toEqual({})
    const current = migrateSave({ ...initial, saveVersion: 13, combat: { ...initial.combat, ruleCooldowns: { valid: 2500, negative: -1, nan: Number.NaN, infinite: Number.POSITIVE_INFINITY, __proto__: 4 } } })
    expect(current.combat.ruleCooldowns).toEqual({ valid: 2500 })
  })

  it('allows local rule IDs across Traits but rejects duplicates within one Trait', () => {
    const registry = TRAIT_DEFINITIONS as Record<string, TraitDefinition>
    const monster = MONSTERS['forest-wisp']
    const originalTraitIds = [...monster.traitIds]
    const originalA = registry['test-validator-a']
    const originalB = registry['test-validator-b']
    const sharedRule = { id: 'threshold', event: 'on-combat-start' as const, effects: [] }
    registry['test-validator-a'] = { id: 'test-validator-a', name: 'Validator A', description: 'Test.', rules: [sharedRule] }
    registry['test-validator-b'] = { id: 'test-validator-b', name: 'Validator B', description: 'Test.', rules: [sharedRule] }
    monster.traitIds = ['test-validator-a' as TraitId, 'test-validator-b' as TraitId]
    try {
      expect(validateMonsterDefinitions()).toEqual([])
      registry['test-validator-a'] = { ...registry['test-validator-a'], rules: [sharedRule, { ...sharedRule }] }
      expect(validateTraitDefinitions()).toContain('[combat-traits] test-validator-a: duplicate rule id')
    } finally {
      monster.traitIds = originalTraitIds
      if (originalA) registry['test-validator-a'] = originalA
      else delete registry['test-validator-a']
      if (originalB) registry['test-validator-b'] = originalB
      else delete registry['test-validator-b']
    }
  })
})
