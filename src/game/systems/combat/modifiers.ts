import { STATUS_DEFINITIONS } from '../../content/statuses'
import { MONSTERS } from '../../content/monsters'
import { equipmentStats } from '../../engine'
import { ITEMS } from '../../content/items/items'
import type { GameState, StatusId } from '../../types'
import type { CombatActor } from './magnitude'
import { evaluateCombatCondition } from './conditionRuntime'
import { getActorTraits } from './traitRuntime'
import type { CombatModifier, CombatSource, CombatTag, DamageType, ModifierKey } from './combatTypes'
import { getStatusGroupStacks } from './statusSelectors'

export interface ModifierContext {
  source?: CombatSource
  sourceTags?: CombatTag[]
  originSourceKind?: CombatSource['kind']
  originTags?: CombatTag[]
  damageType?: DamageType
  statusId?: StatusId
  statusTags?: CombatTag[]
}

const activeStatuses = (state: GameState, actor: CombatActor) => actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses

const matchesModifier = (modifier: CombatModifier, context: ModifierContext) => {
  const sourceTags = [...new Set([...(context.source?.tags ?? []), ...(context.sourceTags ?? [])])]
  const sourceKind = context.source?.kind
  const originSourceKind = context.source?.originSourceKind ?? context.originSourceKind
  const originTags = context.source?.originTags ?? context.originTags
  if (modifier.sourceKinds?.length && (!sourceKind || !modifier.sourceKinds.includes(sourceKind))) return false
  if (modifier.sourceTags?.length && !modifier.sourceTags.every((tag) => sourceTags.includes(tag))) return false
  if (modifier.originSourceKinds?.length && (!originSourceKind || !modifier.originSourceKinds.includes(originSourceKind))) return false
  if (modifier.originTags?.length && !modifier.originTags.every((tag) => originTags?.includes(tag))) return false
  const statusId = context.statusId ?? context.source?.statusId
  if (modifier.statusIds?.length && (!statusId || !modifier.statusIds.includes(statusId))) return false
  if (modifier.damageTypes?.length && (!context.damageType || !modifier.damageTypes.includes(context.damageType))) return false
  if (modifier.statusTags?.length && !modifier.statusTags.every((tag) => context.statusTags?.includes(tag))) return false
  return true
}

const statusModifierValue = (state: GameState, actor: CombatActor, active: GameState['combat']['playerStatuses'][number], modifier: CombatModifier) => {
  const stacks = getStatusGroupStacks(state, actor, active.statusId)
  if (stacks <= 0) return 0
  const value = active.modifierOverrides?.[modifier.key] ?? modifier.value
  return modifier.perStack ? value * Math.max(1, stacks) : value
}

export const getCombatModifiers = (state: GameState, actor: CombatActor, key: ModifierKey, context: ModifierContext = {}) => {
  let total = 0
  activeStatuses(state, actor).forEach((active) => {
    const definition = STATUS_DEFINITIONS[active.statusId]
    definition?.modifiers?.forEach((modifier) => {
      if (modifier.key === key && matchesModifier(modifier, context) && evaluateCombatCondition(state, actor, modifier.condition, { source: context.source, sourceTags: context.sourceTags, statusId: context.statusId })) total += statusModifierValue(state, actor, active, modifier)
    })
  })
  getActorTraits(state, actor).forEach((trait) => trait.modifiers?.forEach((modifier) => {
    if (modifier.key === key && matchesModifier(modifier, context) && evaluateCombatCondition(state, actor, modifier.condition, { source: context.source, sourceTags: context.sourceTags, statusId: context.statusId })) total += modifier.value
  }))
  if (actor === 'player') {
    Object.entries(state.equipment).forEach(([position, itemId]) => {
      if (!itemId) return
      ITEMS[itemId]?.combat?.modifiers?.forEach((modifier) => {
        if (modifier.key === key && matchesModifier(modifier, context) && evaluateCombatCondition(state, actor, modifier.condition, { source: context.source, sourceTags: context.sourceTags, statusId: context.statusId })) total += modifier.value
      })
    })
  }
  return total
}

export const resolveModifier = getCombatModifiers

export const getResistance = (state: GameState, actor: CombatActor, damageType: DamageType) => {
  if (actor === 'enemy' && state.combat.enemyId) return Math.max(-1, Math.min(0.9, MONSTERS[state.combat.enemyId].resistances?.[damageType] ?? 0))
  return Math.max(-1, Math.min(0.9, equipmentStats(state).resistances?.[damageType] ?? 0))
}

export const isImmuneToDamage = (state: GameState, actor: CombatActor, damageType: DamageType) => actor === 'enemy' && Boolean(state.combat.enemyId && MONSTERS[state.combat.enemyId].damageImmunities?.includes(damageType))
