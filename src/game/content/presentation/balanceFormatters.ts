import type {
  ActionPattern,
  AutoCastCondition,
  CombatCondition,
  CombatEffect,
  CombatModifier,
  ItemDefinition,
  Magnitude,
  ModifierKey,
  RecipeUnlockCondition,
} from '../../types'
import type { CombatActionDefinition, CombatTriggerRule, TraitDefinition } from '../../systems/combat/combatTypes'
import { DUNGEONS } from '../dungeons/dungeons'
import { MONSTERS } from '../monsters'
import { STATUS_DEFINITIONS } from '../statuses/statuses'

const readableId = (value: string) => value
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[-_]/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase())
  .replace(/\bXp\b/g, 'XP')
  .replace(/\bHp\b/g, 'HP')

const trimNumber = (value: number, maximumFractionDigits = 2) => {
  if (!Number.isFinite(value)) return 'None'
  return String(Number(value.toFixed(maximumFractionDigits)))
}

export const formatNumber = (value: number) => trimNumber(value)

export const formatPercent = (value: number, maximumFractionDigits = 2) => `${trimNumber(value * 100, maximumFractionDigits)}%`

export const formatSignedPercent = (value: number, maximumFractionDigits = 2) => {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatPercent(value, maximumFractionDigits)}`
}

export const formatDuration = (milliseconds: number | null | undefined) => {
  if (milliseconds === null || milliseconds === undefined) return 'Indefinite'
  if (!Number.isFinite(milliseconds)) return 'None'
  if (milliseconds < 1000) return `${trimNumber(milliseconds)} ms`
  const seconds = milliseconds / 1000
  if (seconds < 60) return `${trimNumber(seconds)} s`
  return `${trimNumber(seconds / 60)} min`
}

const statusName = (statusId: string) => STATUS_DEFINITIONS[statusId as keyof typeof STATUS_DEFINITIONS]?.name ?? readableId(statusId)
const monsterName = (monsterId: string) => MONSTERS[monsterId as keyof typeof MONSTERS]?.name ?? readableId(monsterId)
const dungeonName = (dungeonId: string) => DUNGEONS[dungeonId as keyof typeof DUNGEONS]?.name ?? readableId(dungeonId)
const targetName = (target: 'self' | 'opponent', statusHolder = false) => statusHolder
  ? target === 'self' ? 'the status holder' : 'the opponent of the status holder'
  : target === 'self' ? 'the caster' : 'the opponent'

export const formatMagnitude = (magnitude: Magnitude): string => {
  switch (magnitude.type) {
    case 'flat': return formatNumber(magnitude.value)
    case 'source-max-health-percent': return `${formatPercent(magnitude.value)} of the caster's Max Health`
    case 'target-max-health-percent': return `${formatPercent(magnitude.value)} of the opponent's Max Health`
    case 'source-basic-damage-percent': return `${formatPercent(magnitude.value)} of Basic Attack damage`
    case 'spell-power': return `${formatPercent(magnitude.coefficient)} of Spell Power`
    case 'target-missing-health-percent': return `${formatPercent(magnitude.value)} of the opponent's missing Health`
    case 'school-level': return `${formatNumber(magnitude.base)} + ${formatNumber(magnitude.perLevel)} per ${readableId(magnitude.school)} School level`
  }
}

export const formatCombatEffect = (effect: CombatEffect, context: { statusHolder?: boolean } = {}): string => {
  switch (effect.type) {
    case 'deal-damage': return effect.components.map((component) => `${formatMagnitude(component.magnitude)} ${readableId(component.damageType)} damage to ${targetName(effect.target, context.statusHolder)}`).join(' and ')
    case 'heal': return `Restore ${formatMagnitude(effect.magnitude)} Health to ${targetName(effect.target, context.statusHolder)}`
    case 'gain-barrier': return `Grant ${formatMagnitude(effect.magnitude)} Barrier to ${targetName(effect.target, context.statusHolder)}${effect.mode === 'replace' ? ' (replacing the current Barrier)' : ''}${effect.durationMs === null || effect.durationMs === undefined ? '' : ` for ${formatDuration(effect.durationMs)}`}`
    case 'restore-resource': return `Restore ${formatMagnitude(effect.magnitude)} ${readableId(effect.resource)} to ${targetName(effect.target, context.statusHolder)}`
    case 'drain-resource': return `Drain ${formatMagnitude(effect.magnitude)} ${readableId(effect.resource)} from ${targetName(effect.target, context.statusHolder)}`
    case 'apply-status': {
      const duration = effect.durationMs === null || effect.durationMs === undefined ? '' : ` for ${formatDuration(effect.durationMs)}`
      const stacks = effect.stacks && effect.stacks > 1 ? ` (${effect.stacks} stacks)` : ''
      const periodic = effect.periodicEffects?.length ? `; periodic effect: ${effect.periodicEffects.map((periodicEffect) => formatCombatEffect(periodicEffect, { statusHolder: true })).join('; ')}` : ''
      return `Apply ${statusName(effect.statusId)} to ${targetName(effect.target, context.statusHolder)}${duration}${stacks}${periodic}`
    }
    case 'remove-status': return `Remove ${statusName(effect.statusId)} from ${targetName(effect.target, context.statusHolder)}`
    case 'cleanse': return `Cleanse ${effect.mode === 'tag' ? `${readableId(effect.tag ?? 'status')} statuses` : effect.mode === 'all' ? 'all removable statuses' : 'one removable status'} from ${targetName(effect.target, context.statusHolder)}`
    case 'dispel': return `Dispel ${effect.mode === 'tag' ? `${readableId(effect.tag ?? 'status')} effects` : effect.mode === 'all' ? 'all dispellable statuses' : 'one dispellable status'} from ${targetName(effect.target, context.statusHolder)}`
    case 'modify-action-timer': return `${effect.amountMs >= 0 ? 'Delay' : 'Advance'} ${targetName(effect.target, context.statusHolder)}'s ${effect.action === 'basic-attack' ? 'Basic Attack' : 'current action'} by ${formatDuration(Math.abs(effect.amountMs))}`
    case 'modify-cooldown': return `${effect.amountMs >= 0 ? 'Delay' : 'Advance'} ${effect.spellId ? readableId(effect.spellId) : 'the current spell'} cooldown by ${formatDuration(Math.abs(effect.amountMs))}`
    case 'set-action-pattern': return `Switch ${targetName(effect.target, context.statusHolder)} to the ${readableId(effect.patternId)} action pattern`
  }
}

const conditionSubject = (subject: 'self' | 'target') => subject === 'self' ? "the caster's" : "the opponent's"

export const formatCombatCondition = (condition: CombatCondition | undefined): string => {
  if (!condition) return 'always'
  switch (condition.type) {
    case 'always': return 'always'
    case 'self-hp-below-percent': return `${conditionSubject('self')} Health is below ${formatPercent(condition.percent / 100)}`
    case 'target-hp-below-percent': return `${conditionSubject('target')} Health is below ${formatPercent(condition.percent / 100)}`
    case 'self-hp-above-percent': return `${conditionSubject('self')} Health is above ${formatPercent(condition.percent / 100)}`
    case 'target-hp-above-percent': return `${conditionSubject('target')} Health is above ${formatPercent(condition.percent / 100)}`
    case 'self-has-status': return `the caster has ${statusName(condition.statusId)}`
    case 'target-has-status': return `the opponent has ${statusName(condition.statusId)}`
    case 'self-has-barrier': return 'the caster has a Barrier'
    case 'target-has-barrier': return 'the opponent has a Barrier'
    case 'self-status-stacks-at-least': return `the caster has at least ${condition.stacks} ${statusName(condition.statusId)} stacks`
    case 'target-status-stacks-at-least': return `the opponent has at least ${condition.stacks} ${statusName(condition.statusId)} stacks`
    case 'self-barrier-at-least': return `the caster's Barrier is at least ${formatNumber(condition.value)}`
    case 'self-barrier-at-most': return `the caster's Barrier is at most ${formatNumber(condition.value)}`
    case 'target-barrier-at-least': return `the opponent's Barrier is at least ${formatNumber(condition.value)}`
    case 'target-barrier-at-most': return `the opponent's Barrier is at most ${formatNumber(condition.value)}`
    case 'source-has-tag': return `the source has the ${readableId(condition.tag)} tag`
    case 'event-status-is': return `the current status is ${statusName(condition.statusId)}`
    case 'event-status-has-tag': return `the current status has the ${readableId(condition.tag)} tag`
    case 'event-action-is': return `the current action is ${readableId(condition.actionId)}`
    case 'event-action-has-tag': return `the current action has the ${readableId(condition.tag)} tag`
    case 'event-damage-type-is': return `the current damage type is ${readableId(condition.damageType)}`
    case 'target-has-status-tag': return `the opponent has a ${readableId(condition.tag)} status`
    case 'event-target-is-self': return 'the affected actor is the caster'
    case 'source-is-self': return 'the source is the caster'
    case 'source-is-opponent': return 'the source is the opponent'
    case 'all': return condition.conditions.map(formatCombatCondition).join(' and ')
    case 'any': return condition.conditions.map(formatCombatCondition).join(' or ')
    case 'not': return `not (${formatCombatCondition(condition.condition)})`
  }
}

const modifierLabels: Record<ModifierKey, string> = {
  'damage-dealt-percent': 'Damage dealt',
  'damage-taken-percent': 'Damage taken',
  'basic-attack-damage-percent': 'Basic Attack damage',
  'basic-attack-speed-percent': 'Basic Attack speed',
  'action-speed-percent': 'Action speed',
  'spell-damage-percent': 'Spell damage',
  'melee-damage-percent': 'Melee damage',
  'ranged-damage-percent': 'Ranged damage',
  'healing-done-percent': 'Healing done',
  'healing-received-percent': 'Healing received',
  'barrier-power-percent': 'Barrier power',
  'barrier-received-flat': 'Barrier received',
  'barrier-received-percent': 'Barrier received',
  'mana-regen-percent': 'Mana regeneration',
  'cooldown-recovery-percent': 'Cooldown recovery',
  'control-duration-received-percent': 'Control duration received',
  'status-duration-dealt-percent': 'Status duration dealt',
  'status-duration-received-percent': 'Status duration received',
  'defense-flat': 'Defense',
  'crit-chance': 'Critical Strike chance',
  'crit-damage': 'Critical Strike damage',
  'block-chance': 'Block chance',
  'damage-over-time-percent': 'Damage over time',
  'resistance-percent': 'Resistance',
}

const modifierValue = (modifier: CombatModifier) => modifier.key.endsWith('-percent') || ['crit-chance', 'crit-damage', 'block-chance'].includes(modifier.key)
  ? formatSignedPercent(modifier.value)
  : `${modifier.value > 0 ? '+' : ''}${formatNumber(modifier.value)}`

export const formatCombatModifier = (modifier: CombatModifier): string => {
  const details = [
    `${modifierValue(modifier)} ${modifierLabels[modifier.key]}`,
    modifier.damageTypes?.length ? `for ${modifier.damageTypes.map(readableId).join(', ')} damage` : '',
    modifier.sourceTags?.length ? `from ${modifier.sourceTags.map(readableId).join(', ')} sources` : '',
    modifier.statusTags?.length ? `for ${modifier.statusTags.map(readableId).join(', ')} statuses` : '',
    modifier.statusIds?.length ? `for ${modifier.statusIds.map(statusName).join(', ')}` : '',
    modifier.perStack ? 'per stack' : '',
    modifier.condition && formatCombatCondition(modifier.condition) !== 'always' ? `when ${formatCombatCondition(modifier.condition)}` : '',
  ].filter(Boolean)
  return details.join(' ')
}

const triggerLabel = (event: CombatTriggerRule['event']) => readableId(event.replace(/^on-/, '')).replace(/^Hp /, 'HP ')

export const formatCombatRule = (rule: CombatTriggerRule): string => {
  const name = rule.ui?.name ? `${rule.ui.name}: ` : ''
  const trigger = `When ${triggerLabel(rule.event)}`
  const requirement = rule.condition && formatCombatCondition(rule.condition) !== 'always' ? ` and ${formatCombatCondition(rule.condition)}` : ''
  const timing = rule.oncePerEncounter ? ' Once per encounter.' : ''
  const cooldown = rule.cooldownMs ? ` Cooldown: ${formatDuration(rule.cooldownMs)}.` : ''
  const chance = rule.chance !== undefined ? ` Chance: ${formatPercent(rule.chance)}.` : ''
  return `${name}${trigger}${requirement}: ${rule.effects.map((effect) => formatCombatEffect(effect)).join('; ')}.${timing}${cooldown}${chance}`
}

export const formatStatLabel = (key: string) => {
  const labels: Record<string, string> = {
    basicDamage: 'Basic Attack damage',
    spellPower: 'Spell Power',
    maxHealth: 'Max Health',
    maxMana: 'Max Mana',
    manaRegen: 'Mana regeneration',
    maxFocus: 'Max Focus',
    defense: 'Defense',
    critChance: 'Critical Strike chance',
    critDamage: 'Critical Strike damage',
    basicAttackSpeedPct: 'Basic Attack speed',
    blockChance: 'Block chance',
    cooldownRecoveryPct: 'Cooldown recovery',
    healingDonePct: 'Healing done',
    barrierPowerPct: 'Barrier power',
    damageOverTimePct: 'Damage over time',
    statusDurationPct: 'Status duration',
    manaCostReductionPct: 'Mana cost reduction',
    focusEfficiencyPct: 'Focus efficiency',
    resistances: 'Resistances',
  }
  return labels[key] ?? readableId(key)
}

export const formatStatValue = (key: string, value: number) => key.endsWith('Pct') || ['critChance', 'critDamage', 'blockChance'].includes(key) ? formatSignedPercent(value) : formatNumber(value)

export const formatItemStats = (item: ItemDefinition) => Object.entries(item.stats ?? {}).flatMap(([key, value]) => key === 'resistances'
  ? Object.entries(value ?? {}).map(([damageType, resistance]) => `${readableId(damageType)} resistance: ${formatSignedPercent(Number(resistance))}`)
  : [`${formatStatLabel(key)}: ${formatStatValue(key, Number(value))}`])

export const formatRecipeUnlock = (unlock: RecipeUnlockCondition) => {
  switch (unlock.type) {
    case 'always': return 'Available from the start'
    case 'first-dungeon-boss-kill': return 'Defeat the first dungeon boss'
    case 'boss-kill': return `Defeat ${monsterName(unlock.bossId)}${unlock.count && unlock.count > 1 ? ` ${unlock.count} times` : ''}`
    case 'monster-kill': return `Defeat ${monsterName(unlock.monsterId)}${unlock.count && unlock.count > 1 ? ` ${unlock.count} times` : ''}`
    case 'dungeon-unlocked': return `Unlock ${dungeonName(unlock.dungeonId)}`
  }
}

export const formatAutoCastCondition = (condition: AutoCastCondition | undefined) => {
  if (!condition || condition.type === 'always') return 'Always'
  if (condition.type === 'health-below') return `when the caster's Health is below ${formatPercent(condition.percent / 100)}`
  return `when the caster's Barrier is below ${formatNumber(condition.value)}`
}

export const formatActionPattern = (pattern: ActionPattern, actions: Record<string, { name: string }>) => pattern.steps.map((step) => step.type === 'basic' ? 'Basic Attack' : actions[step.actionId]?.name ?? readableId(step.actionId)).join(' -> ')

export const formatEquipmentEffectSummary = (item: ItemDefinition) => [
  ...(item.combat?.modifiers ?? []).map((modifier) => `Passive: ${formatCombatModifier(modifier)}`),
  ...(item.combat?.rules ?? []).map(formatCombatRule),
]

const compactTriggerLabels: Record<string, string> = {
  'on-combat-start': 'Combat start',
  'on-action-resolve': 'Action resolves',
  'on-kill': 'Kill',
  'on-hp-threshold': 'HP threshold',
  'on-barrier-broken': 'Barrier breaks',
  'on-status-applied': 'Status applied',
  'on-status-removed': 'Status removed',
  'on-damage-taken': 'Damage taken',
  'on-damage-dealt': 'Damage dealt',
}

export const formatCompactCombatEffect = (effect: CombatEffect, context: { statusHolder?: boolean } = {}): string => {
  switch (effect.type) {
    case 'deal-damage': return effect.components.map((component) => `${formatMagnitude(component.magnitude)} ${readableId(component.damageType)} damage`).join(' + ')
    case 'heal': return `+${formatMagnitude(effect.magnitude)} Health`
    case 'gain-barrier': return `+${formatMagnitude(effect.magnitude)} Barrier${effect.durationMs === null || effect.durationMs === undefined ? '' : ` (${formatDuration(effect.durationMs)})`}`
    case 'restore-resource': return `+${formatMagnitude(effect.magnitude)} ${readableId(effect.resource)}`
    case 'drain-resource': return `-${formatMagnitude(effect.magnitude)} ${readableId(effect.resource)}`
    case 'apply-status': {
      const duration = effect.durationMs === null || effect.durationMs === undefined ? '' : ` (${formatDuration(effect.durationMs)})`
      const stacks = effect.stacks && effect.stacks > 1 ? ` x${effect.stacks}` : ''
      const periodic = effect.periodicEffects?.length ? `; ${effect.periodicEffects.map((entry) => formatCompactCombatEffect(entry, { statusHolder: true })).join('; ')}` : ''
      return `${statusName(effect.statusId)}${stacks}${duration}${periodic}`
    }
    case 'remove-status': return `Remove ${statusName(effect.statusId)}`
    case 'cleanse': return `Cleanse ${effect.mode === 'tag' ? readableId(effect.tag ?? 'status') : effect.mode === 'all' ? 'all' : 'one'} status${effect.mode === 'all' ? 'es' : ''}`
    case 'dispel': return `Dispel ${effect.mode === 'tag' ? readableId(effect.tag ?? 'status') : effect.mode === 'all' ? 'all' : 'one'} effect${effect.mode === 'all' ? 's' : ''}`
    case 'modify-action-timer': return `${effect.amountMs >= 0 ? '+' : '-'}${formatDuration(Math.abs(effect.amountMs))} action time`
    case 'modify-cooldown': return `${effect.amountMs >= 0 ? '+' : '-'}${formatDuration(Math.abs(effect.amountMs))} cooldown`
    case 'set-action-pattern': return `Pattern: ${readableId(effect.patternId)}`
  }
}

export const formatCompactCombatRule = (rule: CombatTriggerRule): string => {
  const trigger = compactTriggerLabels[rule.event] ?? readableId(rule.event.replace(/^on-/, ''))
  const requirement = rule.condition && formatCombatCondition(rule.condition) !== 'always' ? ` when ${formatCombatCondition(rule.condition)}` : ''
  const details = rule.effects.map((effect) => formatCompactCombatEffect(effect)).join('; ')
  const once = rule.oncePerEncounter ? ' (once/encounter)' : ''
  const cooldown = rule.cooldownMs ? ` (${formatDuration(rule.cooldownMs)} CD)` : ''
  const chance = rule.chance !== undefined ? ` (${formatPercent(rule.chance)} chance)` : ''
  return `${trigger}${requirement} -> ${details}${once}${cooldown}${chance}`
}

export const formatCompactTrait = (trait: TraitDefinition) => [
  trait.description,
  ...(trait.modifiers ?? []).map(formatCombatModifier),
  ...(trait.rules ?? []).map(formatCompactCombatRule),
].filter(Boolean).join('; ')

export const formatCompactPattern = (pattern: ActionPattern, actions: Record<string, CombatActionDefinition>) => formatActionPattern(pattern, actions)

export const formatCompactEquipmentSpecial = (item: ItemDefinition) => [
  ...(item.combat?.modifiers ?? []).map((modifier) => formatCombatModifier(modifier)),
  ...(item.combat?.rules ?? []).map(formatCompactCombatRule),
].filter(Boolean).join('; ')

export const formatReadableId = readableId
