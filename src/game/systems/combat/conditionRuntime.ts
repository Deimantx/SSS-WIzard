import { STATUS_DEFINITIONS } from '../../content/statuses'
import type { GameState } from '../../types'
import type { CombatActor } from './magnitude'
import type { CombatCondition, CombatConditionContext } from './combatTypes'
import { getStatusGroupStacks, hasStatus } from './statusSelectors'

const opponentOf = (actor: CombatActor): CombatActor => actor === 'player' ? 'enemy' : 'player'
const barrierFor = (state: GameState, actor: CombatActor) => actor === 'player' ? state.combat.playerBarrier : state.combat.enemyBarrier
const hpPercent = (state: GameState, actor: CombatActor) => {
  const max = actor === 'player' ? state.player.maxHealth : state.combat.enemyMaxHp
  const hp = actor === 'player' ? state.player.health : state.combat.enemyHp
  return hp / Math.max(1, max) * 100
}

const changedActorFor = (context: CombatConditionContext) => context.changedActor ?? context.eventTarget
const contextualHpPercent = (state: GameState, actor: CombatActor, context: CombatConditionContext) => changedActorFor(context) === actor && context.currentHpPercent !== undefined ? context.currentHpPercent : hpPercent(state, actor)
const sourceTagsFor = (context: CombatConditionContext) => [...new Set([...(context.source?.tags ?? []), ...(context.sourceTags ?? [])])]

/** Evaluates a condition against the actor that owns the condition. */
export const evaluateCombatCondition = (state: GameState, actor: CombatActor, condition: CombatCondition | undefined, context: CombatConditionContext = {}): boolean => {
  if (!condition || condition.type === 'always') return true
  const target = opponentOf(actor)
  switch (condition.type) {
    case 'self-hp-below-percent': return contextualHpPercent(state, actor, context) <= condition.percent
    case 'target-hp-below-percent': return contextualHpPercent(state, target, context) <= condition.percent
    case 'self-hp-above-percent': return contextualHpPercent(state, actor, context) >= condition.percent
    case 'target-hp-above-percent': return contextualHpPercent(state, target, context) >= condition.percent
    case 'self-has-status': return hasStatus(state, actor, condition.statusId)
    case 'target-has-status': return hasStatus(state, target, condition.statusId)
    case 'self-status-stacks-at-least': return getStatusGroupStacks(state, actor, condition.statusId) >= condition.stacks
    case 'target-status-stacks-at-least': return getStatusGroupStacks(state, target, condition.statusId) >= condition.stacks
    case 'self-has-barrier': return barrierFor(state, actor) > 0
    case 'target-has-barrier': return barrierFor(state, target) > 0
    case 'self-barrier-at-least': return barrierFor(state, actor) >= condition.value
    case 'self-barrier-at-most': return barrierFor(state, actor) <= condition.value
    case 'target-barrier-at-least': return barrierFor(state, target) >= condition.value
    case 'target-barrier-at-most': return barrierFor(state, target) <= condition.value
    case 'source-has-tag': return sourceTagsFor(context).includes(condition.tag)
    case 'event-status-is': return context.statusId === condition.statusId
    case 'event-status-has-tag': return context.eventStatusTags?.includes(condition.tag) ?? false
    case 'event-action-is': return context.actionId === condition.actionId
    case 'event-action-has-tag': return context.eventActionTags?.includes(condition.tag) ?? false
    case 'source-is-self': return context.source?.actor === actor
    case 'source-is-opponent': return context.source?.actor === opponentOf(actor)
    case 'all': return condition.conditions.every((entry) => evaluateCombatCondition(state, actor, entry, context))
    case 'any': return condition.conditions.some((entry) => evaluateCombatCondition(state, actor, entry, context))
    case 'not': return !evaluateCombatCondition(state, actor, condition.condition, context)
  }
}

const thresholdActor = (actor: CombatActor, type: CombatCondition['type']) => type.startsWith('target-') ? opponentOf(actor) : actor

const crossedLeaf = (actor: CombatActor, condition: Extract<CombatCondition, { type: 'self-hp-below-percent' | 'target-hp-below-percent' | 'self-hp-above-percent' | 'target-hp-above-percent' }>, context: CombatConditionContext, negated: boolean) => {
  if (changedActorFor(context) !== thresholdActor(actor, condition.type)) return false
  if (context.previousHpPercent === undefined || context.currentHpPercent === undefined) return false
  if (condition.type.endsWith('below-percent')) return negated
    ? context.previousHpPercent <= condition.percent && context.currentHpPercent > condition.percent
    : context.previousHpPercent > condition.percent && context.currentHpPercent <= condition.percent
  return negated
    ? context.previousHpPercent >= condition.percent && context.currentHpPercent < condition.percent
    : context.previousHpPercent < condition.percent && context.currentHpPercent >= condition.percent
}

/** Returns true only when at least one HP threshold leaf in a condition crossed. */
export const conditionContainsCrossedHpThreshold = (actor: CombatActor, condition: CombatCondition | undefined, context: CombatConditionContext, negated = false): boolean => {
  if (!condition) return false
  switch (condition.type) {
    case 'self-hp-below-percent':
    case 'target-hp-below-percent':
    case 'self-hp-above-percent':
    case 'target-hp-above-percent': return crossedLeaf(actor, condition, context, negated)
    case 'all':
    case 'any': return condition.conditions.some((entry) => conditionContainsCrossedHpThreshold(actor, entry, context, negated))
    case 'not': return conditionContainsCrossedHpThreshold(actor, condition.condition, context, !negated)
    default: return false
  }
}

/** Useful to validate that an on-hp-threshold rule has a meaningful threshold condition. */
export const conditionHasHpThreshold = (condition: CombatCondition | undefined): boolean => {
  if (!condition) return false
  if (condition.type === 'self-hp-below-percent' || condition.type === 'target-hp-below-percent' || condition.type === 'self-hp-above-percent' || condition.type === 'target-hp-above-percent') return true
  if (condition.type === 'all' || condition.type === 'any') return condition.conditions.some(conditionHasHpThreshold)
  if (condition.type === 'not') return conditionHasHpThreshold(condition.condition)
  return false
}

export { opponentOf }
