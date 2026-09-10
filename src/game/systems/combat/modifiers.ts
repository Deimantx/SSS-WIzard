import { STATUS_DEFINITIONS } from '../../content/statuses'
import { MONSTERS } from '../../content/monsters'
import { getEffectiveEquipmentItemStats, getEquipmentStats } from '../../core/equipment/equipmentStats'
import { MAX_RESISTANCE, MIN_RESISTANCE } from '../../core/balance/combatStats'
import { ITEMS } from '../../content/items/items'
import type { EquipmentStats, GameState, StatusId } from '../../types'
import type { CombatActor } from './magnitude'
import { evaluateCombatCondition } from './conditionRuntime'
import { getActorTraits } from './traitRuntime'
import type { CombatModifier, CombatSource, CombatTag, DamageType, ModifierKey } from './combatTypes'
import { getStatusGroupStacks } from './statusSelectors'
import { getRootCombatSourceProvenance, isEnemySourceOwnerActive } from './combatProvenance'
import { getAllocatedArtifactCombatProviders } from '../artifacts/artifactProgression'

export type CombatModifierState = {
  player: Pick<GameState['player'], 'health' | 'maxHealth' | 'mana' | 'maxMana'>
  combat: Pick<GameState['combat'], 'enemyId' | 'enemyInstanceKey' | 'enemyHp' | 'enemyMaxHp' | 'playerBarrier' | 'enemyBarrier' | 'playerStatuses' | 'enemyStatuses'>
  equipment: GameState['equipment']
  artifactProgress: GameState['artifactProgress']
}
export type CombatModifierEvaluation = 'active' | 'unconditional' | 'all'

export interface ModifierContext {
  source?: CombatSource
  sourceTags?: CombatTag[]
  originSourceKind?: CombatSource['kind']
  originTags?: CombatTag[]
  damageType?: DamageType
  damageTypes?: DamageType[]
  statusId?: StatusId
  statusTags?: CombatTag[]
}

export interface CombatModifierContribution {
  modifier: CombatModifier
  value: number
  sourceType: 'status' | 'trait' | 'equipment' | 'equipment-stats' | 'artifact'
  sourceId?: string
  sourceName?: string
}

const EQUIPMENT_MODIFIER_STATS: Partial<Record<ModifierKey, keyof EquipmentStats>> = {
  'defense-flat': 'defense',
  'crit-chance': 'critChance',
  'crit-damage': 'critDamage',
  'basic-attack-speed-percent': 'basicAttackSpeedPct',
  'block-chance': 'blockChance',
  'cooldown-recovery-percent': 'cooldownRecoveryPct',
  'healing-done-percent': 'healingDonePct',
  'barrier-power-percent': 'barrierPowerPct',
  'damage-over-time-percent': 'damageOverTimePct',
  'status-duration-dealt-percent': 'statusDurationPct',
}

const activeStatuses = (state: CombatModifierState, actor: CombatActor) => actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses

const matchesModifier = (modifier: CombatModifier, context: ModifierContext) => {
  const sourceTags = [...new Set([...(context.source?.tags ?? []), ...(context.sourceTags ?? [])])]
  const sourceKind = context.source?.kind
  const root = context.source ? getRootCombatSourceProvenance(context.source) : undefined
  const originSourceKind = root?.sourceKind ?? context.originSourceKind
  const originTags = root?.tags ?? context.originTags
  if (modifier.sourceKinds?.length && (!sourceKind || !modifier.sourceKinds.includes(sourceKind))) return false
  if (modifier.sourceTags?.length && !modifier.sourceTags.every((tag) => sourceTags.includes(tag))) return false
  if (modifier.originSourceKinds?.length && (!originSourceKind || !modifier.originSourceKinds.includes(originSourceKind))) return false
  if (modifier.originTags?.length && !modifier.originTags.every((tag) => originTags?.includes(tag))) return false
  const statusId = context.statusId ?? context.source?.statusId
  if (modifier.statusIds?.length && (!statusId || !modifier.statusIds.includes(statusId))) return false
  const damageType = context.damageType ?? context.source?.school
  if (modifier.damageTypes?.length && (!damageType || !modifier.damageTypes.includes(damageType))) return false
  if (modifier.statusTags?.length && !modifier.statusTags.every((tag) => context.statusTags?.includes(tag))) return false
  return true
}

const statusModifierValue = (state: CombatModifierState, actor: CombatActor, active: GameState['combat']['playerStatuses'][number], modifier: CombatModifier) => {
  const stacks = getStatusGroupStacks(state, actor, active.statusId)
  if (stacks <= 0) return 0
  const value = active.modifierOverrides?.[modifier.key] ?? modifier.value
  return modifier.perStack ? value * Math.max(1, stacks) : value
}

const conditionMatches = (state: CombatModifierState, actor: CombatActor, modifier: CombatModifier, context: ModifierContext, evaluation: CombatModifierEvaluation) => {
  if (evaluation === 'all') return true
  if (evaluation === 'unconditional') return !modifier.condition || modifier.condition.type === 'always'
  return evaluateCombatCondition(state, actor, modifier.condition, context)
}

export const getCombatModifierContributions = (state: CombatModifierState, actor: CombatActor, key: ModifierKey, context: ModifierContext = {}, evaluation: CombatModifierEvaluation = 'active'): CombatModifierContribution[] => {
  // Source-side Enemy modifiers belong to the encounter instance that
  // authored the source. A lingering source may still resolve its snapshot,
  // but it cannot borrow the next Enemy's traits/statuses.
  if (actor === 'enemy' && context.source?.actor === 'enemy' && !isEnemySourceOwnerActive(state, context.source)) return []
  const contributions: CombatModifierContribution[] = []
  const add = (modifier: CombatModifier, sourceType: CombatModifierContribution['sourceType'], sourceId?: string, sourceName?: string, value = modifier.value) => {
    if (modifier.key !== key || !matchesModifier(modifier, context) || !conditionMatches(state, actor, modifier, context, evaluation)) return
    contributions.push({ modifier, value, sourceType, sourceId, sourceName })
  }
  activeStatuses(state, actor).forEach((active) => {
    const definition = STATUS_DEFINITIONS[active.statusId]
    definition?.modifiers?.forEach((modifier) => {
      add(modifier, 'status', active.statusId, definition.name, statusModifierValue(state, actor, active, modifier))
    })
  })
  getActorTraits(state, actor).forEach((trait) => trait.modifiers?.forEach((modifier) => {
    add(modifier, 'trait', trait.id, trait.name)
  }))
  if (actor === 'player') {
    Object.values(state.equipment).forEach((itemId) => {
      if (!itemId) return
      ITEMS[itemId]?.combat?.modifiers?.forEach((modifier) => {
        add(modifier, 'equipment', itemId, ITEMS[itemId]?.name)
      })
      getAllocatedArtifactCombatProviders(state, itemId).forEach(provider => provider.modifiers.forEach(modifier => {
        add(modifier, 'artifact', itemId, provider.node.name)
      }))
    })
    const equipmentField = EQUIPMENT_MODIFIER_STATS[key]
    if (equipmentField) Object.values(state.equipment).forEach((itemId) => {
      if (!itemId) return
      const value = Number(getEffectiveEquipmentItemStats(state, itemId)[equipmentField] ?? 0)
      if (value !== 0) add({ key, value }, 'equipment-stats', itemId, ITEMS[itemId]?.name, value)
    })
  }
  return contributions
}

export const getCombatModifiers = (state: CombatModifierState, actor: CombatActor, key: ModifierKey, context: ModifierContext = {}, evaluation: CombatModifierEvaluation = 'active') => {
  return getCombatModifierContributions(state, actor, key, context, evaluation).reduce((total, contribution) => total + contribution.value, 0)
}

export const resolveModifier = getCombatModifiers

export const getResistance = (state: CombatModifierState, actor: CombatActor, damageType: DamageType, context: ModifierContext = {}) => {
  if (actor === 'enemy' && !state.combat.enemyId) return 0
  const authored = actor === 'player'
    ? getEquipmentStats(state).resistances?.[damageType] ?? 0
    : state.combat.enemyId
      ? MONSTERS[state.combat.enemyId]?.resistances?.[damageType] ?? 0
      : 0
  const modified = authored + getCombatModifiers(state, actor, 'resistance-percent', { ...context, damageType })
  return Math.max(MIN_RESISTANCE, Math.min(MAX_RESISTANCE, modified))
}

export const isImmuneToDamage = (state: GameState, actor: CombatActor, damageType: DamageType) => actor === 'enemy' && Boolean(state.combat.enemyId && MONSTERS[state.combat.enemyId].damageImmunities?.includes(damageType))
