import { STATUS_DEFINITIONS } from '../../content/statuses'
import { MONSTERS } from '../../content/monsters'
import { equipmentStats } from '../../engine'
import type { GameState, StatusId } from '../../types'
import type { CombatActor } from './magnitude'
import { evaluateCombatCondition } from './conditionRuntime'
import { getActorTraits } from './traitRuntime'
import type { CombatModifier, CombatSource, CombatTag, DamageType, ModifierKey } from './combatTypes'

export interface ModifierContext {
  source?: CombatSource
  sourceTags?: CombatTag[]
  damageType?: DamageType
  statusTags?: CombatTag[]
}

const activeStatuses = (state: GameState, actor: CombatActor) => actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses

const matchesModifier = (modifier: CombatModifier, context: ModifierContext) => {
  const sourceTags = [...new Set([...(context.source?.tags ?? []), ...(context.sourceTags ?? [])])]
  if (modifier.sourceTags?.length && !modifier.sourceTags.every((tag) => sourceTags.includes(tag))) return false
  if (modifier.damageTypes?.length && (!context.damageType || !modifier.damageTypes.includes(context.damageType))) return false
  if (modifier.statusTags?.length && !modifier.statusTags.every((tag) => context.statusTags?.includes(tag))) return false
  return true
}

const statusModifierValue = (state: GameState, actor: CombatActor, statusId: StatusId, modifier: CombatModifier) => {
  const active = activeStatuses(state, actor).find((status) => status.statusId === statusId)
  if (!active) return 0
  return modifier.perStack ? modifier.value * Math.max(1, active.stacks) : modifier.value
}

export const getCombatModifiers = (state: GameState, actor: CombatActor, key: ModifierKey, context: ModifierContext = {}) => {
  let total = 0
  activeStatuses(state, actor).forEach((active) => {
    const definition = STATUS_DEFINITIONS[active.statusId]
    definition?.modifiers?.forEach((modifier) => {
      if (modifier.key === key && matchesModifier(modifier, context) && evaluateCombatCondition(state, actor, modifier.condition, { source: context.source, sourceTags: context.sourceTags })) total += statusModifierValue(state, actor, active.statusId, modifier)
    })
  })
  getActorTraits(state, actor).forEach((trait) => trait.modifiers?.forEach((modifier) => {
    if (modifier.key === key && matchesModifier(modifier, context) && evaluateCombatCondition(state, actor, modifier.condition, { source: context.source, sourceTags: context.sourceTags })) total += modifier.value
  }))
  return total
}

export const resolveModifier = getCombatModifiers

export const getResistance = (state: GameState, actor: CombatActor, damageType: DamageType) => {
  if (actor === 'enemy' && state.combat.enemyId) return Math.max(-1, Math.min(0.9, MONSTERS[state.combat.enemyId].resistances?.[damageType] ?? 0))
  return Math.max(-1, Math.min(0.9, equipmentStats(state).resistances?.[damageType] ?? 0))
}

export const isImmuneToDamage = (state: GameState, actor: CombatActor, damageType: DamageType) => actor === 'enemy' && Boolean(state.combat.enemyId && MONSTERS[state.combat.enemyId].damageImmunities?.includes(damageType))
