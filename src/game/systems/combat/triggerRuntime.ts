import { STATUS_DEFINITIONS } from '../../content/statuses'
import { ITEMS } from '../../content/items/items'
import { EQUIPMENT_POSITIONS } from '../../core/equipment'
import { appendLog } from '../../engine'
import type { ActiveStatus, GameState, ItemId, StatusId, TraitId } from '../../types'
import type { CombatActor } from './magnitude'
import { getActorTraits } from './traitRuntime'
import { conditionContainsCrossedHpThreshold, conditionHasHpThreshold, evaluateCombatCondition } from './conditionRuntime'
import type { CombatConditionContext, CombatEffect, CombatEventSink, CombatSource, CombatTag, CombatTrigger, CombatTriggerRule } from './combatTypes'

export type CombatEventContext = CombatConditionContext
export type TriggerEffectExecutor = (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number, uiEvents?: CombatEventSink) => void

const MAX_TRIGGER_DEPTH = 20
const statusesFor = (state: GameState, actor: CombatActor) => actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses

export interface OwnedRule {
  rule: CombatTriggerRule
  ownerKind: 'trait' | 'status' | 'equipment'
  ownerId: string
  ownerName: string
  actor: CombatActor
  sourceTags: CombatTag[]
  equipmentPosition?: (typeof EQUIPMENT_POSITIONS)[number]
  stableOrder: number
}

/** Collects rules in authored provider/trait/rule order. */
export const collectOwnedRules = (state: GameState, actor: CombatActor, transientStatuses: ActiveStatus[] = []): OwnedRule[] => {
  const owned: OwnedRule[] = []
  let stableOrder = 0
  getActorTraits(state, actor).forEach((trait) => {
    trait.rules?.forEach((rule) => {
      owned.push({ rule, ownerKind: 'trait', ownerId: trait.id, ownerName: trait.name, actor, sourceTags: ['trait'], stableOrder })
      stableOrder += 1
    })
  })
  ;[...statusesFor(state, actor), ...transientStatuses].forEach((status) => {
    const definition = STATUS_DEFINITIONS[status.statusId]
    // Per-source status triggers are rejected by content validation and are
    // also ignored defensively until instance-level trigger semantics exist.
    if (definition?.applicationPolicy === 'per-source') return
    definition?.triggers?.forEach((rule) => {
      owned.push({ rule, ownerKind: 'status', ownerId: status.statusId, ownerName: definition.name, actor, sourceTags: ['status', ...definition.tags], stableOrder })
      stableOrder += 1
    })
  })
  if (actor === 'player') EQUIPMENT_POSITIONS.forEach((position) => {
    const itemId = state.equipment[position]
    const item = itemId ? ITEMS[itemId] : undefined
    item?.combat?.rules?.forEach((rule) => {
      owned.push({ rule, ownerKind: 'equipment', ownerId: item.id, ownerName: item.name, actor, sourceTags: ['equipment'], equipmentPosition: position, stableOrder })
      stableOrder += 1
    })
  })
  return owned
}

export const getRuleRuntimeKey = (actor: CombatActor, ownerKind: OwnedRule['ownerKind'], ownerId: string, ruleId: string, equipmentPosition?: OwnedRule['equipmentPosition']) => equipmentPosition && ownerKind === 'equipment'
  ? `${actor}:${ownerKind}:${equipmentPosition}:${ownerId}:${ruleId}`
  : `${actor}:${ownerKind}:${ownerId}:${ruleId}`

export const tickRuleCooldowns = (state: GameState, deltaMs: number) => {
  if (!state.combat.active || !state.combat.enemyId) return
  const delta = Math.max(0, deltaMs)
  const cooldowns = state.combat.ruleCooldowns ?? {}
  state.combat.ruleCooldowns = cooldowns
  Object.keys(cooldowns).forEach((key) => {
    cooldowns[key] = Math.max(0, cooldowns[key] - delta)
  })
}

export const resetCombatRuleRuntime = (state: GameState) => {
  state.combat.triggeredRuleIds = []
  state.combat.ruleCooldowns = {}
}

export const runCombatTriggers = (
  state: GameState,
  actor: CombatActor,
  event: CombatTrigger,
  context: CombatEventContext = {},
  executeEffects: TriggerEffectExecutor,
  depth = 0,
  transientStatuses: ActiveStatus[] = [],
  uiEvents?: CombatEventSink,
) => {
  if (depth >= MAX_TRIGGER_DEPTH) return
  const rules = collectOwnedRules(state, actor, transientStatuses)
    .filter(({ rule }) => rule.event === event)
    .sort((left, right) => (left.rule.priority ?? 0) - (right.rule.priority ?? 0) || left.stableOrder - right.stableOrder)

  state.combat.triggeredRuleIds ??= []
  state.combat.ruleCooldowns ??= {}
  rules.forEach(({ rule, ownerKind, ownerId, ownerName, sourceTags, equipmentPosition }) => {
    const runtimeKey = getRuleRuntimeKey(actor, ownerKind, ownerId, rule.id, equipmentPosition)
    if (rule.oncePerEncounter && state.combat.triggeredRuleIds.includes(runtimeKey)) return
    if ((state.combat.ruleCooldowns[runtimeKey] ?? 0) > 0) return
    if (event === 'on-hp-threshold' && !conditionHasHpThreshold(rule.condition)) return
    if (event === 'on-hp-threshold' && !conditionContainsCrossedHpThreshold(actor, rule.condition, context)) return
    if (!evaluateCombatCondition(state, actor, rule.condition, context)) return

    // State is recorded before effects so recursive events cannot re-enter the
    // same rule before its once/cooldown guard has been established.
    if (rule.oncePerEncounter) state.combat.triggeredRuleIds.push(runtimeKey)
    if (rule.cooldownMs && rule.cooldownMs > 0) state.combat.ruleCooldowns[runtimeKey] = rule.cooldownMs
    const source: CombatSource = { actor, kind: ownerKind === 'equipment' ? 'equipment' : ownerKind, sourceId: ownerId, ruleId: rule.id, tags: sourceTags }
    uiEvents?.push({ source: actor === 'enemy' && state.combat.enemyId ? { kind: 'enemy', monsterId: state.combat.enemyId } : actor === 'player' ? { kind: 'player' } : { kind: 'system' }, sourceKind: ownerKind === 'equipment' ? 'equipment' : 'system', target: context.eventTarget, targetMonsterId: context.eventTarget === 'enemy' ? state.combat.enemyId ?? undefined : undefined, category: ownerKind === 'trait' ? 'trait' : 'system', sourceId: ownerId, itemId: ownerKind === 'equipment' ? ownerId as ItemId : undefined, traitId: ownerKind === 'trait' ? ownerId as TraitId : undefined, statusId: ownerKind === 'status' ? ownerId as StatusId : undefined, amount: context.amount, damageType: context.damageType, healthDamage: context.healthDamage, barrierAbsorbed: context.barrierDamage })
    executeEffects(state, rule.effects, source, depth + 1, uiEvents)
    if (actor === 'enemy') appendLog(state, `${ownerName} triggers.`)
  })
}

export { evaluateCombatCondition }
