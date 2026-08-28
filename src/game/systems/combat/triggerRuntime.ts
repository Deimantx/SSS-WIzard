import { MONSTERS } from '../../content/monsters/whisperingWoods'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { appendLog } from '../../engine'
import type { GameState } from '../../types'
import type { CombatActor } from './magnitude'
import type { CombatCondition, CombatEffect, CombatSource, CombatTag, CombatTrigger, CombatTriggerRule, DamageType } from './combatTypes'

export interface CombatEventContext {
  source?: CombatSource
  target?: CombatActor
  sourceTags?: CombatTag[]
  statusId?: string
  amount?: number
  healthDamage?: number
  barrierDamage?: number
  damageType?: DamageType
  previousHp?: number
  currentHp?: number
  previousHpPercent?: number
  currentHpPercent?: number
}

export type TriggerEffectExecutor = (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number) => void

const statusesFor = (state: GameState, actor: CombatActor) => actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses
const hasBarrier = (state: GameState, actor: CombatActor) => actor === 'player' ? state.combat.playerBarrier > 0 : state.combat.enemyBarrier > 0
const hpPercent = (state: GameState, actor: CombatActor) => {
  const max = actor === 'player' ? state.player.maxHealth : state.combat.enemyMaxHp
  const hp = actor === 'player' ? state.player.health : state.combat.enemyHp
  return hp / Math.max(1, max) * 100
}
const contextualHpPercent = (state: GameState, actor: CombatActor, context: CombatEventContext) => context.target === actor && context.currentHpPercent !== undefined ? context.currentHpPercent : hpPercent(state, actor)

export const evaluateCombatCondition = (state: GameState, actor: CombatActor, condition: CombatCondition | undefined, context: CombatEventContext = {}): boolean => {
  if (!condition || condition.type === 'always') return true
  const target = context.target ?? (actor === 'player' ? 'enemy' : 'player')
  switch (condition.type) {
    case 'self-hp-below-percent': return contextualHpPercent(state, actor, context) <= condition.percent
    case 'target-hp-below-percent': return contextualHpPercent(state, target, context) <= condition.percent
    case 'self-has-status': return statusesFor(state, actor).some((status) => status.statusId === condition.statusId)
    case 'target-has-status': return statusesFor(state, target).some((status) => status.statusId === condition.statusId)
    case 'self-has-barrier': return hasBarrier(state, actor)
    case 'target-has-barrier': return hasBarrier(state, target)
    case 'source-has-tag': return Boolean(context.sourceTags?.includes(condition.tag) || context.source?.tags?.includes(condition.tag))
    case 'status-stack-at-least': return statusesFor(state, actor).some((status) => status.statusId === condition.statusId && status.stacks >= condition.stacks)
    case 'all': return condition.conditions.every((entry) => evaluateCombatCondition(state, actor, entry, context))
    case 'any': return condition.conditions.some((entry) => evaluateCombatCondition(state, actor, entry, context))
    case 'not': return !evaluateCombatCondition(state, actor, condition.condition, context)
  }
}

interface OwnedRule {
  rule: CombatTriggerRule
  kind: 'trait' | 'status'
  sourceId: string
  keyId: string
  tags: CombatTag[]
}

const rulesFor = (state: GameState, actor: CombatActor): OwnedRule[] => {
  const traitRules = actor === 'enemy' && state.combat.enemyId
    ? MONSTERS[state.combat.enemyId].traits.flatMap((trait) => (trait.rules ?? []).map((rule) => ({ rule, kind: 'trait' as const, sourceId: rule.id, keyId: `${trait.id}:${rule.id}`, tags: ['trait' as const] })))
    : []
  const statusRules = statusesFor(state, actor).flatMap((status) => (STATUS_DEFINITIONS[status.statusId]?.triggers ?? []).map((rule) => ({ rule, kind: 'status' as const, sourceId: status.statusId, keyId: `${status.statusId}:${rule.id}`, tags: ['status' as const, ...(STATUS_DEFINITIONS[status.statusId]?.tags ?? [])] })))
  return [...traitRules, ...statusRules]
}

const hpThresholdCrossed = (state: GameState, actor: CombatActor, condition: CombatCondition, context: CombatEventContext): boolean => {
  const target = context.target ?? (actor === 'player' ? 'enemy' : 'player')
  switch (condition.type) {
    case 'self-hp-below-percent': return context.previousHpPercent === undefined || (context.previousHpPercent > condition.percent && (context.currentHpPercent ?? hpPercent(state, actor)) <= condition.percent)
    case 'target-hp-below-percent': {
      // A threshold event is emitted for the actor whose HP changed. A rule
      // targeting the other actor can only evaluate its current state here;
      // it did not cross because of this damage event.
      if (target !== actor) return false
      return context.previousHpPercent === undefined || (context.previousHpPercent > condition.percent && (context.currentHpPercent ?? hpPercent(state, target)) <= condition.percent)
    }
    case 'all': return condition.conditions.every((entry) => hpThresholdCrossed(state, actor, entry, context))
    case 'any': return condition.conditions.some((entry) => hpThresholdCrossed(state, actor, entry, context))
    case 'not': return true
    default: return true
  }
}

export const runCombatTriggers = (state: GameState, actor: CombatActor, event: CombatTrigger, context: CombatEventContext, executeEffects: TriggerEffectExecutor, depth = 0) => {
  if (depth >= 20) return
  rulesFor(state, actor).filter(({ rule }) => rule.event === event).forEach(({ rule, kind, sourceId, keyId, tags }) => {
    const triggerKey = `${actor}:${kind}:${keyId}`
    if (rule.oncePerEncounter && state.combat.triggeredRuleIds.includes(triggerKey)) return
    if (event === 'on-hp-threshold' && rule.condition && !hpThresholdCrossed(state, actor, rule.condition, context)) return
    if (!evaluateCombatCondition(state, actor, rule.condition, context)) return
    if (rule.oncePerEncounter) state.combat.triggeredRuleIds.push(triggerKey)
    executeEffects(state, rule.effects, { actor, kind, sourceId, tags }, depth + 1)
    if (actor === 'enemy') {
      const trait = kind === 'trait' && state.combat.enemyId ? MONSTERS[state.combat.enemyId].traits.find((entry) => entry.rules?.includes(rule)) : undefined
      appendLog(state, `${trait?.name ?? (kind === 'status' ? STATUS_DEFINITIONS[sourceId as keyof typeof STATUS_DEFINITIONS]?.name : rule.id) ?? rule.id} triggers.`)
    }
  })
}
