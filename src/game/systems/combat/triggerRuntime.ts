import { MONSTERS } from '../../content/monsters/whisperingWoods'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { appendLog } from '../../engine'
import type { GameState } from '../../types'
import type { CombatActor } from './magnitude'
import type { CombatCondition, CombatEffect, CombatSource, CombatTag, CombatTrigger, CombatTriggerRule } from './combatTypes'

export interface CombatEventContext {
  source?: CombatSource
  target?: CombatActor
  sourceTags?: CombatTag[]
  statusId?: string
}

export type TriggerEffectExecutor = (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number) => void

const statusesFor = (state: GameState, actor: CombatActor) => actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses
const hasBarrier = (state: GameState, actor: CombatActor) => actor === 'player' ? state.combat.playerBarrier > 0 : state.combat.enemyBarrier > 0
const hpPercent = (state: GameState, actor: CombatActor) => {
  const max = actor === 'player' ? state.player.maxHealth : state.combat.enemyMaxHp
  const hp = actor === 'player' ? state.player.health : state.combat.enemyHp
  return hp / Math.max(1, max) * 100
}

export const evaluateCombatCondition = (state: GameState, actor: CombatActor, condition: CombatCondition | undefined, context: CombatEventContext = {}): boolean => {
  if (!condition || condition.type === 'always') return true
  const target = context.target ?? (actor === 'player' ? 'enemy' : 'player')
  switch (condition.type) {
    case 'self-hp-below-percent': return hpPercent(state, actor) <= condition.percent
    case 'target-hp-below-percent': return hpPercent(state, target) <= condition.percent
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

const rulesFor = (state: GameState, actor: CombatActor): CombatTriggerRule[] => {
  const traitRules = actor === 'enemy' && state.combat.enemyId ? MONSTERS[state.combat.enemyId].traits.flatMap((trait) => trait.rules ?? []) : []
  const statusRules = statusesFor(state, actor).flatMap((status) => STATUS_DEFINITIONS[status.statusId]?.triggers ?? [])
  return [...traitRules, ...statusRules]
}

export const runCombatTriggers = (state: GameState, actor: CombatActor, event: CombatTrigger, context: CombatEventContext, executeEffects: TriggerEffectExecutor, depth = 0) => {
  if (depth >= 20) return
  rulesFor(state, actor).filter((rule) => rule.event === event).forEach((rule) => {
    if (rule.oncePerEncounter && state.combat.triggeredRuleIds.includes(rule.id)) return
    if (!evaluateCombatCondition(state, actor, rule.condition, context)) return
    if (rule.oncePerEncounter) state.combat.triggeredRuleIds.push(rule.id)
    executeEffects(state, rule.effects, { actor, kind: 'trait', sourceId: rule.id, tags: ['trait'] }, depth + 1)
    if (actor === 'enemy') {
      const trait = state.combat.enemyId ? MONSTERS[state.combat.enemyId].traits.find((entry) => entry.rules?.includes(rule)) : undefined
      appendLog(state, `${trait?.name ?? rule.id} triggers.`)
    }
  })
}
