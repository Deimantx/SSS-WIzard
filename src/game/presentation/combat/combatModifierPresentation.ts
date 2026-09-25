import { STATUS_DEFINITIONS } from '../../content/statuses'
import type { CombatCondition, CombatModifier, CombatSource, CombatTag, DamageType, ModifierKey, StatusId } from '../../systems/combat/combatTypes'

const MODIFIER_LABELS: Record<ModifierKey, string> = {
  'damage-dealt-percent': 'Damage Dealt',
  'damage-taken-percent': 'Damage Taken',
  'basic-attack-damage-percent': 'Basic Attack Damage',
  'basic-attack-speed-percent': 'Basic Attack Speed',
  'action-speed-percent': 'Action Speed',
  'spell-damage-percent': 'Spell Damage',
  'melee-damage-percent': 'Melee Damage',
  'ranged-damage-percent': 'Ranged Damage',
  'healing-done-percent': 'Healing Done',
  'healing-received-percent': 'Healing Received',
  'barrier-power-percent': 'Barrier Power',
  'barrier-received-flat': 'Barrier Received',
  'barrier-received-percent': 'Barrier Received',
  'mana-regen-percent': 'Mana Regeneration',
  'cooldown-recovery-percent': 'Cooldown Recovery',
  'spell-cast-time-percent': 'Spell Cast Time',
  'control-duration-received-percent': 'Control Duration Received',
  'status-duration-dealt-percent': 'Status Duration',
  'status-duration-received-percent': 'Status Duration Received',
  'defense-flat': 'Defense',
  'defense-percent': 'Defense',
  'crit-chance': 'Critical Chance',
  'crit-damage': 'Critical Damage',
  'block-chance': 'Block Chance',
  'damage-over-time-percent': 'Damage over Time',
  'resistance-percent': 'Resistance',
  'health-regen-flat': 'Health Regeneration',
}

const PERCENT_MODIFIERS = new Set<ModifierKey>([
  'damage-dealt-percent',
  'damage-taken-percent',
  'basic-attack-damage-percent',
  'basic-attack-speed-percent',
  'action-speed-percent',
  'spell-damage-percent',
  'melee-damage-percent',
  'ranged-damage-percent',
  'healing-done-percent',
  'healing-received-percent',
  'barrier-power-percent',
  'barrier-received-percent',
  'mana-regen-percent',
  'cooldown-recovery-percent',
  'spell-cast-time-percent',
  'control-duration-received-percent',
  'status-duration-dealt-percent',
  'status-duration-received-percent',
  'defense-percent',
  'crit-chance',
  'crit-damage',
  'block-chance',
  'damage-over-time-percent',
  'resistance-percent',
])

const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  physical: 'Physical',
  arcane: 'Arcane',
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
  air: 'Air',
}

const TAG_LABELS: Partial<Record<CombatTag, string>> = {
  buff: 'Buff',
  debuff: 'Debuff',
  control: 'Control',
  direct: 'Direct',
  dot: 'Damage over time',
  hot: 'Healing over time',
  magic: 'Magic',
  melee: 'Melee',
  ranged: 'Ranged',
  spell: 'Spell',
  weapon: 'Weapon',
}

const formatValue = (value: number) => {
  const rounded = Math.round(value * 1000) / 1000
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${formatValue(value * 100)}%`
const formatSignedNumber = (value: number) => `${value >= 0 ? '+' : ''}${formatValue(value)}`
const statusName = (statusId: StatusId) => STATUS_DEFINITIONS[statusId]?.name ?? statusId.replace(/[-_]/g, ' ')
const tagName = (tag: CombatTag) => TAG_LABELS[tag] ?? tag.replace(/[-_]/g, ' ')

export const formatCombatCondition = (condition?: CombatCondition): string | undefined => {
  if (!condition) return undefined
  switch (condition.type) {
    case 'always': return 'Always'
    case 'self-hp-below-percent': return `While below ${condition.percent}% Health`
    case 'target-hp-below-percent': return `While target is below ${condition.percent}% Health`
    case 'self-hp-above-percent': return `While above ${condition.percent}% Health`
    case 'target-hp-above-percent': return `While target is above ${condition.percent}% Health`
    case 'self-mana-above-percent': return `While above ${condition.percent}% Mana`
    case 'self-mana-below-percent': return `While below ${condition.percent}% Mana`
    case 'self-has-status': return `While affected by ${statusName(condition.statusId)}`
    case 'target-has-status': return `Against targets affected by ${statusName(condition.statusId)}`
    case 'self-has-status-tag': return `While affected by ${tagName(condition.tag)} statuses`
    case 'target-has-status-tag': return `Against targets affected by ${tagName(condition.tag)} statuses`
    case 'self-status-stacks-at-least': return `With at least ${condition.stacks} ${statusName(condition.statusId)} stacks`
    case 'target-status-stacks-at-least': return `Against targets with at least ${condition.stacks} ${statusName(condition.statusId)} stacks`
    case 'self-has-barrier': return 'While holding Barrier'
    case 'target-has-barrier': return 'Against targets with Barrier'
    case 'self-barrier-at-least': return `While holding at least ${formatValue(condition.value)} Barrier`
    case 'self-barrier-at-most': return `While holding at most ${formatValue(condition.value)} Barrier`
    case 'target-barrier-at-least': return `Against targets with at least ${formatValue(condition.value)} Barrier`
    case 'target-barrier-at-most': return `Against targets with at most ${formatValue(condition.value)} Barrier`
    case 'source-has-tag': return `For sources tagged ${tagName(condition.tag)}`
    case 'event-status-is': return `When ${statusName(condition.statusId)} is involved`
    case 'event-status-has-tag': return `When a ${tagName(condition.tag)} status is involved`
    case 'event-action-is': return `When ${condition.actionId.replace(/[-_]/g, ' ')} resolves`
    case 'event-action-has-tag': return `When a ${tagName(condition.tag)} action resolves`
    case 'event-damage-type-is': return `When ${DAMAGE_TYPE_LABELS[condition.damageType]} damage is involved`
    case 'target-negative-status-count-at-least': return `Against targets with at least ${condition.count} negative statuses`
    case 'self-negative-status-count-at-least': return `While affected by at least ${condition.count} negative statuses`
    case 'event-is-critical': return 'On a critical hit'
    case 'event-was-blocked': return 'When the hit is blocked'
    case 'event-health-damage-positive': return 'When Health damage is dealt'
    case 'event-amount-positive': return 'When the effect has a positive amount'
    case 'event-target-is-self': return 'When the event targets self'
    case 'source-is-self': return 'When the source is self'
    case 'source-is-opponent': return 'When the source is the opponent'
    case 'all': return condition.conditions.map(formatCombatCondition).filter(Boolean).join(' and ')
    case 'any': return condition.conditions.map(formatCombatCondition).filter(Boolean).join(' or ')
    case 'not': return `Not ${formatCombatCondition(condition.condition) ?? 'the listed condition'}`
  }
}

const sourceLabel = (sourceKinds?: Array<CombatSource['kind']>) => sourceKinds?.length
  ? sourceKinds.map((source) => source.replace(/[-_]/g, ' ')).join(', ')
  : undefined

const tagLabel = (tags?: CombatTag[]) => tags?.length ? tags.map(tagName).join(', ') : undefined

const modifierLabel = (modifier: CombatModifier) => {
  const base = MODIFIER_LABELS[modifier.key]
  const damageTypes = modifier.damageTypes?.map((type) => DAMAGE_TYPE_LABELS[type]).join(', ')
  if (damageTypes) return `${damageTypes} ${base}`
  return base
}

/** Converts authored combat modifier payloads into one shared player-facing sentence. */
export const formatCombatModifier = (modifier: CombatModifier) => {
  let label = modifierLabel(modifier)
  const filters: string[] = []
  const sources = sourceLabel(modifier.sourceKinds)
  const sourceTags = tagLabel(modifier.sourceTags)
  const originSources = sourceLabel(modifier.originSourceKinds)
  const originTags = tagLabel(modifier.originTags)
  if (sources) filters.push(`from ${sources}`)
  if (sourceTags) filters.push(`with ${sourceTags} tags`)
  if (originSources) filters.push(`from ${originSources} origins`)
  if (originTags) filters.push(`with ${originTags} origin tags`)
  if (modifier.statusIds?.length) filters.push(`for ${modifier.statusIds.map(statusName).join(', ')}`)
  if (modifier.statusTags?.length) filters.push(`for ${modifier.statusTags.map(tagName).join(', ')} statuses`)
  const condition = formatCombatCondition(modifier.condition)
  if (condition && condition !== 'Always') filters.push(condition)
  if (filters.length) label += ` (${filters.join('; ')})`
  const value = PERCENT_MODIFIERS.has(modifier.key) ? formatPercent(modifier.value) : formatSignedNumber(modifier.value)
  return `${value} ${label}${modifier.perStack ? ' per stack' : ''}`
}

export const getCombatModifierLabel = (key: ModifierKey) => MODIFIER_LABELS[key]
