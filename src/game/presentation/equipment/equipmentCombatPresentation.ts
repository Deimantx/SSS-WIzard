import { STATUS_DEFINITIONS } from '../../content/statuses/statuses'
import { formatSpellMagnitude } from '../spells/spellEffectTooltipModel'
import type { ItemDefinition } from '../../types'
import type { CombatCondition, CombatEffect, CombatModifier, CombatSource, CombatTag, CombatTriggerRule, DamageType, Magnitude, ModifierKey, StatusId } from '../../systems/combat/combatTypes'
import { scaleMagnitude } from '../../systems/combat/combatTypes'
import { getEffectiveAppliedStatusModifiers } from '../combat/statusEffectPresentation'
import { formatTime } from '../../utils'

export interface EquipmentRulePresentation {
  id: string
  trigger: string
  condition?: string
  effects: string[]
  cooldown?: string
  summary: string
}

export interface EquipmentCombatPresentation {
  modifiers: string[]
  rules: EquipmentRulePresentation[]
  primarySummary: string | null
}

type EquipmentCombat = NonNullable<ItemDefinition['combat']>

const DAMAGE_TYPE_NAMES: Record<DamageType, string> = { physical: 'Physical', arcane: 'Arcane', fire: 'Fire', water: 'Water', earth: 'Earth', air: 'Air' }
const SOURCE_KIND_NAMES: Record<CombatSource['kind'], string> = {
  'basic-attack': 'Basic Attacks', spell: 'Spells', weapon: 'Weapons', status: 'Status Effects', trait: 'Traits', action: 'Actions', equipment: 'Equipment', system: 'System',
}
const TAG_NAMES: Record<CombatTag, string> = {
  'basic-attack': 'Basic Attack', spell: 'Spell', weapon: 'Weapon', equipment: 'Equipment', melee: 'Melee', ranged: 'Ranged', magic: 'Magic', direct: 'Direct', heal: 'Heal', dot: 'Damage over Time', hot: 'Heal over Time', status: 'Status', special: 'Special', trait: 'Trait', buff: 'Buff', debuff: 'Debuff', control: 'Control', barrier: 'Barrier', physical: 'Physical', arcane: 'Arcane', fire: 'Fire', water: 'Water', earth: 'Earth', air: 'Air',
}
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
  'control-duration-received-percent': 'Control Duration Received',
  'status-duration-dealt-percent': 'Status Duration Dealt',
  'status-duration-received-percent': 'Status Duration Received',
  'defense-flat': 'Defense',
  'crit-chance': 'Crit Chance',
  'crit-damage': 'Crit Damage',
  'block-chance': 'Block Chance',
  'damage-over-time-percent': 'Damage over Time',
  'resistance-percent': 'Resistance',
}

const PERCENT_MODIFIERS = new Set<ModifierKey>([
  'damage-dealt-percent', 'damage-taken-percent', 'basic-attack-damage-percent', 'basic-attack-speed-percent', 'action-speed-percent', 'spell-damage-percent', 'melee-damage-percent', 'ranged-damage-percent', 'healing-done-percent', 'healing-received-percent', 'barrier-power-percent', 'barrier-received-percent', 'mana-regen-percent', 'cooldown-recovery-percent', 'control-duration-received-percent', 'status-duration-dealt-percent', 'status-duration-received-percent', 'crit-chance', 'crit-damage', 'block-chance', 'damage-over-time-percent', 'resistance-percent',
])

const titleCase = (value: string) => value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const signed = (value: number, suffix = '') => `${value >= 0 ? '+' : ''}${value}${suffix}`
const formattedPercent = (value: number) => {
  const rounded = Math.round(value * 1000) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
const percent = (value: number) => `${value >= 0 ? '+' : ''}${formattedPercent(value)}%`
const finite = (value: number) => Number.isFinite(value) ? value : 0
const amount = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
const statusName = (statusId: string) => STATUS_DEFINITIONS[statusId as StatusId]?.name ?? titleCase(statusId)

const sourcePhrase = (kinds: CombatSource['kind'][] | undefined) => kinds?.length === 1 ? SOURCE_KIND_NAMES[kinds[0]] : kinds?.length ? kinds.map((kind) => SOURCE_KIND_NAMES[kind]).join(', ') : null
const damagePhrase = (types: DamageType[] | undefined) => types?.length === 1 ? DAMAGE_TYPE_NAMES[types[0]] : types?.length ? types.map((type) => DAMAGE_TYPE_NAMES[type]).join(', ') : null
const tagPhrase = (tags: CombatTag[] | undefined) => tags?.length ? tags.map((tag) => TAG_NAMES[tag]).join(', ') : null

const modifierMeaning = (modifier: CombatModifier) => {
  const key = modifier.key
  const base = MODIFIER_LABELS[key]
  const damage = damagePhrase(modifier.damageTypes)
  const sources = sourcePhrase(modifier.sourceKinds)
  let label = base

  if (key === 'spell-damage-percent' && damage && sources === 'Spells') label = `${damage} Spell Damage`
  else if (key === 'barrier-power-percent' && damage && sources === 'Spells') label = `Barrier Power from ${damage} Spells`
  else if (damage && key === 'resistance-percent') label = `${damage} Resistance`
  else if (damage) label = `${damage} ${base}`
  else if (sources && !['defense-flat', 'crit-chance', 'crit-damage', 'block-chance'].includes(key)) label = `${base} from ${sources}`

  const filters: string[] = []
  const sourceTags = tagPhrase(modifier.sourceTags)
  const originSources = sourcePhrase(modifier.originSourceKinds)
  const originTags = tagPhrase(modifier.originTags)
  if (sourceTags) filters.push(`with ${sourceTags} tags`)
  if (originSources) filters.push(`from ${originSources}`)
  if (originTags) filters.push(`with ${originTags} origin tags`)
  if (modifier.statusIds?.length) filters.push(`for ${modifier.statusIds.map(statusName).join(', ')}`)
  if (modifier.statusTags?.length) filters.push(`for ${tagPhrase(modifier.statusTags)} statuses`)
  if (modifier.condition) filters.push(conditionMeaning(modifier.condition))
  if (filters.length) label += ` (${filters.join('; ')})`

  const numericValue = finite(modifier.value)
  const value = PERCENT_MODIFIERS.has(key) ? percent(numericValue) : signed(Number(amount(numericValue)))
  return `${value} ${label}${modifier.perStack ? ' per stack' : ''}`
}

const conditionMeaning = (condition: CombatCondition): string => {
  switch (condition.type) {
    case 'always': return 'Always'
    case 'self-hp-below-percent': return `While below ${condition.percent}% Health`
    case 'target-hp-below-percent': return `While target is below ${condition.percent}% Health`
    case 'self-hp-above-percent': return `While above ${condition.percent}% Health`
    case 'target-hp-above-percent': return `While target is above ${condition.percent}% Health`
    case 'self-has-status': return `While affected by ${statusName(condition.statusId)}`
    case 'target-has-status': return `Against targets affected by ${statusName(condition.statusId)}`
    case 'self-status-stacks-at-least': return `With at least ${condition.stacks} ${statusName(condition.statusId)} stacks`
    case 'target-status-stacks-at-least': return `Against targets with at least ${condition.stacks} ${statusName(condition.statusId)} stacks`
    case 'self-has-barrier': return 'While you have Barrier'
    case 'target-has-barrier': return 'Against targets with Barrier'
    case 'self-barrier-at-least': return `While you have at least ${amount(condition.value)} Barrier`
    case 'self-barrier-at-most': return `While you have at most ${amount(condition.value)} Barrier`
    case 'target-barrier-at-least': return `Against targets with at least ${amount(condition.value)} Barrier`
    case 'target-barrier-at-most': return `Against targets with at most ${amount(condition.value)} Barrier`
    case 'source-has-tag': return `With a ${TAG_NAMES[condition.tag]} source`
    case 'event-status-is': return `When ${statusName(condition.statusId)} is involved`
    case 'event-status-has-tag': return `When a ${TAG_NAMES[condition.tag]} status is involved`
    case 'event-action-is': return `When ${titleCase(condition.actionId)} resolves`
    case 'event-action-has-tag': return `When a ${TAG_NAMES[condition.tag]} action resolves`
    case 'event-damage-type-is': return `When ${DAMAGE_TYPE_NAMES[condition.damageType]} damage is involved`
    case 'source-is-self': return 'When you are the source'
    case 'source-is-opponent': return 'When the opponent is the source'
    case 'all': return condition.conditions.map(conditionMeaning).join(' and ')
    case 'any': return condition.conditions.map(conditionMeaning).join(' or ')
    case 'not': return `Not ${conditionMeaning(condition.condition)}`
  }
}

const formatMagnitude = (magnitude: Magnitude, noun: string) => {
  switch (magnitude.type) {
    case 'flat': return `${amount(magnitude.value)} ${noun}`
    case 'spell-power': return `${amount(magnitude.coefficient)}× Spell Power ${noun}`
    case 'source-max-health-percent': return `${formatSpellMagnitude(magnitude)} as ${noun}`
    case 'target-max-health-percent': return `${formatSpellMagnitude(magnitude)} as ${noun}`
    case 'source-basic-damage-percent': return `${formatSpellMagnitude(magnitude)} as ${noun}`
    case 'target-missing-health-percent': return `${formatSpellMagnitude(magnitude)} as ${noun}`
    case 'school-level': return `${amount(magnitude.base)} + ${amount(magnitude.perLevel)} per ${titleCase(magnitude.school)} level ${noun}`
  }
}

const duration = (durationMs: number | null | undefined) => durationMs === null || durationMs === undefined ? null : formatTime(durationMs)

const effectMeaning = (effect: CombatEffect): string => {
  switch (effect.type) {
    case 'deal-damage': return effect.components.map((component) => `Deal ${formatMagnitude(component.magnitude, `${DAMAGE_TYPE_NAMES[component.damageType]} damage`)}`).join(' and ')
    case 'heal': return `Restore ${formatMagnitude(effect.magnitude, 'Health')}`
    case 'gain-barrier': return `${effect.mode === 'replace' ? 'Set' : 'Gain'} ${formatMagnitude(effect.magnitude, 'Barrier')}`
    case 'restore-resource': return `Restore ${formatMagnitude(effect.magnitude, 'Mana')}`
    case 'drain-resource': return `Drain ${formatMagnitude(effect.magnitude, 'Mana')}`
    case 'apply-status': {
      const statusDuration = effect.durationMs === undefined ? STATUS_DEFINITIONS[effect.statusId]?.defaultDurationMs : effect.durationMs
      const stackText = effect.stacks === undefined ? '' : ` (${effect.stacks} ${effect.stacks === 1 ? 'stack' : 'stacks'})`
      return `Apply ${statusName(effect.statusId)}${duration(statusDuration) ? ` for ${duration(statusDuration)}` : ''}${stackText}`
    }
    case 'remove-status': return `Remove ${statusName(effect.statusId)}`
    case 'cleanse': return `Cleanse ${effect.mode === 'tag' ? `${TAG_NAMES[effect.tag as CombatTag]} statuses` : effect.mode === 'one' ? 'one debuff' : 'all debuffs'}`
    case 'dispel': return `Dispel ${effect.mode === 'tag' ? `${TAG_NAMES[effect.tag as CombatTag]} statuses` : effect.mode === 'one' ? 'one buff' : 'all buffs'}`
    case 'modify-action-timer': return `${effect.amountMs < 0 ? 'Reduce' : 'Delay'} ${effect.action === 'current' ? 'current action' : 'Basic Attack'} by ${formatTime(Math.abs(effect.amountMs))}`
    case 'modify-cooldown': return `${effect.amountMs < 0 ? 'Reduce' : 'Increase'} ${effect.spellId ? titleCase(effect.spellId) : 'Spell'} cooldown by ${formatTime(Math.abs(effect.amountMs))}`
    case 'set-action-pattern': return `Switch to ${titleCase(effect.patternId)} pattern`
  }
}

const periodicStatusDetails = (effect: Extract<CombatEffect, { type: 'apply-status' }>): string[] => {
  const status = STATUS_DEFINITIONS[effect.statusId]
  const periodicEffects = effect.periodicEffects ?? status?.periodic?.effects
  if (!periodicEffects?.length) return []
  const durationMs = effect.durationMs === undefined ? status?.defaultDurationMs : effect.durationMs
  const intervalMs = status?.periodic?.intervalMs ?? 0
  const tickCount = durationMs !== null && durationMs !== undefined && intervalMs > 0 ? Math.floor(Math.max(0, durationMs) / intervalMs) : 0
  return periodicEffects.flatMap((periodicEffect) => {
    if (periodicEffect.type !== 'deal-damage') {
      return `${effectMeaning(periodicEffect)}${intervalMs > 0 ? ` per ${formatTime(intervalMs)}` : ''}`
    }
    return periodicEffect.components.map((component) => {
      const totalMagnitude = tickCount > 0 ? scaleMagnitude(component.magnitude, tickCount) : component.magnitude
      const cadence = tickCount > 0 ? 'total' : intervalMs > 0 ? `per ${formatTime(intervalMs)}` : 'per tick'
      return `${formatSpellMagnitude(totalMagnitude)} ${cadence} ${DAMAGE_TYPE_NAMES[component.damageType]} damage`
    })
  })
}

const applyStatusDetails = (effect: Extract<CombatEffect, { type: 'apply-status' }>): string[] => {
  const modifierDetails = getEffectiveAppliedStatusModifiers(effect.statusId, effect.modifierOverrides).map(modifierMeaning)
  return [effectMeaning(effect), ...modifierDetails, ...periodicStatusDetails(effect)]
}

const effectDetails = (effect: CombatEffect) => effect.type === 'apply-status' ? applyStatusDetails(effect) : [effectMeaning(effect)]

const triggerMeaning = (rule: CombatTriggerRule) => {
  const labels: Record<CombatTriggerRule['event'], string> = {
    'on-combat-start': 'Combat Start', 'on-basic-attack-hit': 'Basic Attack Hit', 'on-spell-hit': 'Spell Hit', 'on-damage-dealt': 'Damage Dealt', 'on-damage-taken': 'Damage Taken', 'on-barrier-broken': 'Barrier Broken', 'on-status-applied': 'Status Applied', 'on-hp-threshold': 'Health Threshold', 'on-action-start': 'Action Start', 'on-action-resolve': 'Action Resolve', 'on-heal': 'Healing', 'on-heal-received': 'Healing Received', 'on-barrier-gained': 'Barrier Gained', 'on-status-removed': 'Status Removed', 'on-status-expired': 'Status Expired', 'on-kill': 'Kill',
  }
  return rule.chance === undefined ? `On ${labels[rule.event]}` : `${formattedPercent(rule.chance)}% chance on ${labels[rule.event]}`
}

export const getEquipmentCombatPresentation = (itemOrCombat: Pick<ItemDefinition, 'combat'> | EquipmentCombat | undefined): EquipmentCombatPresentation => {
  const combat: EquipmentCombat | undefined = itemOrCombat
    ? Object.prototype.hasOwnProperty.call(itemOrCombat, 'combat')
      ? (itemOrCombat as Pick<ItemDefinition, 'combat'>).combat
      : itemOrCombat as EquipmentCombat
    : undefined
  const modifiers = combat?.modifiers?.map(modifierMeaning) ?? []
  const rules = combat?.rules?.map((rule) => {
    const effects = rule.effects.flatMap(effectDetails)
    const condition = rule.condition ? conditionMeaning(rule.condition) : undefined
    const cooldown = rule.cooldownMs && rule.cooldownMs > 0 ? `Cooldown: ${formatTime(rule.cooldownMs)}` : undefined
    const summary = `${triggerMeaning(rule)}${condition ? ` · ${condition}` : ''}${effects[0] ? ` → ${effects[0]}` : ''}`
    return { id: rule.id, trigger: triggerMeaning(rule), condition, effects, cooldown, summary }
  }) ?? []
  return { modifiers, rules, primarySummary: modifiers[0] ?? rules[0]?.summary ?? null }
}

export const getEquipmentPrimaryCombatSummary = (itemOrCombat: Pick<ItemDefinition, 'combat'> | EquipmentCombat | undefined) => getEquipmentCombatPresentation(itemOrCombat).primarySummary
