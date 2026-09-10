import { STATUS_DEFINITIONS } from '../../content/statuses/statuses'
import { SPELLS } from '../../content/spells/spells'
import { getCooldownRecoveryMultiplier, getEffectiveFocusCost, getEffectiveManaCost } from '../../systems/combat/combatStats'
import { getCombatModifierContributions, getCombatModifiers, type CombatModifierContribution } from '../../systems/combat/modifiers'
import { getPeriodicTiming, resolveStatusDuration } from '../../systems/combat/statusRuntime'
import { resolveMagnitude } from '../../systems/combat/magnitude'
import { getSpellPowerBreakdown } from '../../systems/spells/spellPower'
import { getSpellCombatSource } from '../../systems/spells/spellSource'
import type { CombatEffect, CombatSource, CombatTag, DamageComponent, DamageType, GameState, Magnitude, ModifierKey, SpellId } from '../../types'
import { formatTime } from '../../utils'

/**
 * State required to describe a Spell. Live timers/cooldowns are deliberately
 * not part of this read model so Combat can keep the structural presentation
 * stable while its simulation clock advances.
 */
export type SpellPresentationState = {
  schools: GameState['schools']
  equipment: GameState['equipment']
  artifactProgress: GameState['artifactProgress']
  progress: Pick<GameState['progress'], 'spellRanks'>
  activities: Pick<GameState['activities'], 'autoCast'>
  player: Pick<GameState['player'], 'health' | 'maxHealth' | 'mana' | 'maxMana'>
  combat: Pick<GameState['combat'], 'enemyId' | 'enemyHp' | 'enemyMaxHp' | 'enemyBarrier' | 'playerBarrier' | 'enemyInstanceKey' | 'playerStatuses' | 'enemyStatuses'>
  debug: Pick<GameState['debug'], 'allowFocusOverCap'>
}

export interface EffectiveSpellValue {
  base: number
  effective: number
  changed: boolean
  modifiers?: SpellPreviewModifier[]
  conditionalModifiers?: SpellPreviewModifier[]
}

export interface SpellPreviewModifier {
  key: ModifierKey
  value: number
  label: string
  sourceName?: string
  condition?: string
}

export interface SpellDamagePreview extends EffectiveSpellValue {
  damageType: DamageType
  modifiers: SpellPreviewModifier[]
  conditionalModifiers: SpellPreviewModifier[]
}

export interface SpellDotPreview extends SpellDamagePreview {
  damagePerTick: EffectiveSpellValue
  totalDamage: EffectiveSpellValue
  fullTicks: number
  partialTickFraction: number
  tickIntervalMs: number
}

export interface SpellDurationPreview extends EffectiveSpellValue {
  modifiers: SpellPreviewModifier[]
  conditionalModifiers: SpellPreviewModifier[]
}

const uniqueTags = (...groups: Array<readonly CombatTag[] | undefined>) => [...new Set(groups.flatMap((group) => group ?? []))]
/** The same player Spell source identity used by castSpellInternal. */
export const getSpellPresentationSource = getSpellCombatSource

const getPeriodicPresentationSource = (spellId: SpellId, statusId: Extract<CombatEffect, { type: 'apply-status' }>['statusId']): CombatSource => {
  const spell = SPELLS[spellId]
  const rootTags = uniqueTags(getSpellPresentationSource(spellId).tags)
  const statusTags = STATUS_DEFINITIONS[statusId]?.tags ?? []
  return {
    ...getSpellPresentationSource(spellId),
    kind: 'status',
    sourceId: statusId,
    statusId,
    originSourceId: spell.id,
    originSourceKind: 'spell',
    originTags: rootTags,
    originSchool: spell.school,
    school: spell.school,
    tags: uniqueTags(['status'], statusTags, rootTags),
  }
}

const conditionLabel = (condition: NonNullable<CombatModifierContribution['modifier']['condition']>): string => {
  const statusName = (id: string) => STATUS_DEFINITIONS[id as keyof typeof STATUS_DEFINITIONS]?.name ?? id.replace(/[-_]/g, ' ')
  switch (condition.type) {
    case 'always': return 'Always'
    case 'self-hp-below-percent': return `while below ${condition.percent}% Health`
    case 'target-hp-below-percent': return `against targets below ${condition.percent}% Health`
    case 'self-hp-above-percent': return `while above ${condition.percent}% Health`
    case 'self-mana-above-percent': return `while above ${condition.percent}% Mana`
    case 'target-hp-above-percent': return `against targets above ${condition.percent}% Health`
    case 'self-has-status': return `while affected by ${statusName(condition.statusId)}`
    case 'target-has-status': return `against ${statusName(condition.statusId)} targets`
    case 'self-status-stacks-at-least': return `with ${condition.stacks}+ ${statusName(condition.statusId)} stacks`
    case 'target-status-stacks-at-least': return `against targets with ${condition.stacks}+ ${statusName(condition.statusId)} stacks`
    case 'self-has-barrier': return 'while you have Barrier'
    case 'target-has-barrier': return 'against targets with Barrier'
    case 'self-barrier-at-least': return `with at least ${condition.value} Barrier`
    case 'self-barrier-at-most': return `with at most ${condition.value} Barrier`
    case 'target-barrier-at-least': return `against targets with at least ${condition.value} Barrier`
    case 'target-barrier-at-most': return `against targets with at most ${condition.value} Barrier`
    case 'source-has-tag': return `with a ${condition.tag} source`
    case 'event-status-is': return `when ${statusName(condition.statusId)} is involved`
    case 'event-status-has-tag': return `when a ${condition.tag} status is involved`
    case 'event-action-is': return `when ${condition.actionId} resolves`
    case 'event-action-has-tag': return `when a ${condition.tag} action resolves`
    case 'event-damage-type-is': return `when ${condition.damageType} damage is involved`
    case 'target-has-status-tag': return `against targets with ${condition.tag} statuses`
    case 'event-target-is-self': return 'when the event affects you'
    case 'source-is-self': return 'when you are the source'
    case 'source-is-opponent': return 'when the opponent is the source'
    case 'all': return condition.conditions.map(conditionLabel).join(' and ')
    case 'any': return condition.conditions.map(conditionLabel).join(' or ')
    case 'not': return `not ${conditionLabel(condition.condition)}`
  }
}

const modifierName = (key: ModifierKey, damageType?: DamageType) => {
  if (key === 'spell-damage-percent') return damageType ? `${damageType[0].toUpperCase()}${damageType.slice(1)} Spell Damage` : 'Spell Damage'
  if (key === 'damage-over-time-percent') return 'Damage over Time'
  if (key === 'damage-dealt-percent') return 'Damage Dealt'
  if (key === 'status-duration-dealt-percent') return 'Status Duration'
  if (key === 'healing-done-percent') return 'Healing Done'
  if (key === 'barrier-power-percent') return 'Barrier Power'
  if (key === 'cooldown-recovery-percent') return 'Cooldown Recovery'
  return key.replace(/-percent$/, '').replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const asPreviewModifier = (contribution: CombatModifierContribution, damageType?: DamageType): SpellPreviewModifier => ({
  key: contribution.modifier.key,
  value: contribution.value,
  label: modifierName(contribution.modifier.key, damageType),
  sourceName: contribution.sourceName,
  condition: contribution.modifier.condition && contribution.modifier.condition.type !== 'always' ? conditionLabel(contribution.modifier.condition) : undefined,
})

const modifierRows = (state: SpellPresentationState, source: CombatSource, tags: CombatTag[], keys: ModifierKey[], damageType?: DamageType, statusTags?: CombatTag[]) => {
  const rows: SpellPreviewModifier[] = []
  const conditional: SpellPreviewModifier[] = []
  keys.forEach((key) => {
    const context = { source, sourceTags: tags, damageType, statusTags }
    getCombatModifierContributions(state, 'player', key, context, 'unconditional').forEach((entry) => { if (entry.value !== 0) rows.push(asPreviewModifier(entry, damageType)) })
    getCombatModifierContributions(state, 'player', key, context, 'all').filter((entry) => entry.modifier.condition && entry.modifier.condition.type !== 'always').forEach((entry) => conditional.push(asPreviewModifier(entry, damageType)))
  })
  return { rows, conditional }
}

const effectiveSourceDamage = (state: SpellPresentationState, raw: number, source: CombatSource, tags: CombatTag[], damageType: DamageType) => {
  const context = { source, sourceTags: tags, damageType }
  let amount = Math.max(0, raw) * Math.max(0, 1 + getCombatModifiers(state, 'player', 'damage-dealt-percent', context, 'unconditional'))
  amount *= Math.max(0, 1 + getCombatModifiers(state, 'player', 'spell-damage-percent', context, 'unconditional'))
  if (tags.includes('dot')) amount *= Math.max(0, 1 + getCombatModifiers(state, 'player', 'damage-over-time-percent', context, 'unconditional'))
  return amount
}

const targetFor = (effect: CombatEffect): 'player' | 'enemy' => effect.target === 'self' ? 'player' : 'enemy'
const resolvedEffectMagnitude = (state: SpellPresentationState, magnitude: Magnitude, source: CombatSource, effect: CombatEffect) => resolveMagnitude(state, magnitude, source, targetFor(effect))

export const getEffectiveSpellDirectDamagePreview = (state: SpellPresentationState, spellId: SpellId, effect: Extract<CombatEffect, { type: 'deal-damage' }>, component: DamageComponent): SpellDamagePreview => {
  const tags = uniqueTags(getSpellPresentationSource(spellId).tags, effect.tags)
  const source = getSpellPresentationSource(spellId)
  const base = resolvedEffectMagnitude(state, component.magnitude, source, effect)
  const effective = effectiveSourceDamage(state, base, source, tags, component.damageType)
  const modifierKeys: ModifierKey[] = ['damage-dealt-percent', 'spell-damage-percent']
  if (tags.includes('direct')) modifierKeys.push('crit-chance', 'crit-damage')
  const modifiers = modifierRows(state, source, tags, modifierKeys, component.damageType)
  return { base, effective, changed: effective !== base, damageType: component.damageType, modifiers: modifiers.rows, conditionalModifiers: modifiers.conditional }
}

export const getEffectiveSpellStatusDurationPreview = (state: SpellPresentationState, spellId: SpellId, effect: Extract<CombatEffect, { type: 'apply-status' }>): SpellDurationPreview => {
  const source = getSpellPresentationSource(spellId)
  const status = STATUS_DEFINITIONS[effect.statusId]
  const base = effect.durationMs === undefined ? status?.defaultDurationMs ?? null : effect.durationMs
  const effective = resolveStatusDuration(state, 'enemy', effect.statusId, base, source, { includeReceiverModifiers: false, modifierEvaluation: 'unconditional' })
  const tags = uniqueTags(source.tags)
  const modifiers = modifierRows(state, source, tags, ['status-duration-dealt-percent'], undefined, status?.tags)
  return { base: base ?? 0, effective: effective ?? 0, changed: effective !== base, modifiers: modifiers.rows, conditionalModifiers: modifiers.conditional }
}

export const getEffectiveSpellDotPreview = (state: SpellPresentationState, spellId: SpellId, statusEffect: Extract<CombatEffect, { type: 'apply-status' }>, periodicEffect: Extract<CombatEffect, { type: 'deal-damage' }>, component: DamageComponent, effectiveDurationMs: number | null): SpellDotPreview | null => {
  const status = STATUS_DEFINITIONS[statusEffect.statusId]
  const intervalMs = status?.periodic?.intervalMs ?? 0
  const timing = getPeriodicTiming(effectiveDurationMs, intervalMs)
  if (!timing) return null
  const source = getPeriodicPresentationSource(spellId, statusEffect.statusId)
  const tags = uniqueTags(source.tags, periodicEffect.tags)
  const base = resolvedEffectMagnitude(state, component.magnitude, source, { ...periodicEffect, target: 'opponent' })
  const effective = effectiveSourceDamage(state, base, source, tags, component.damageType)
  const totalBase = base * timing.totalTickEquivalents
  const totalEffective = effective * timing.totalTickEquivalents
  const modifiers = modifierRows(state, source, tags, ['damage-dealt-percent', 'spell-damage-percent', 'damage-over-time-percent'], component.damageType, status?.tags)
  return { base: totalBase, effective: totalEffective, changed: totalEffective !== totalBase, damageType: component.damageType, modifiers: modifiers.rows, conditionalModifiers: modifiers.conditional, damagePerTick: { base, effective, changed: effective !== base }, totalDamage: { base: totalBase, effective: totalEffective, changed: totalEffective !== totalBase }, fullTicks: timing.fullTicks, partialTickFraction: timing.partialTickFraction, tickIntervalMs: intervalMs }
}

export const getEffectiveSpellHealingPreview = (state: SpellPresentationState, spellId: SpellId, effect: Extract<CombatEffect, { type: 'heal' }>): EffectiveSpellValue => {
  const source = getSpellPresentationSource(spellId)
  const base = resolvedEffectMagnitude(state, effect.magnitude, source, effect)
  const modifierRowsForEffect = modifierRows(state, source, source.tags ?? [], ['healing-done-percent'])
  const effective = Math.max(0, base * (1 + getCombatModifiers(state, 'player', 'healing-done-percent', { source, sourceTags: source.tags }, 'unconditional')))
  return { base, effective, changed: effective !== base, modifiers: modifierRowsForEffect.rows, conditionalModifiers: modifierRowsForEffect.conditional }
}

export const getEffectiveSpellBarrierPreview = (state: SpellPresentationState, spellId: SpellId, effect: Extract<CombatEffect, { type: 'gain-barrier' }>): EffectiveSpellValue => {
  const source = getSpellPresentationSource(spellId)
  const base = resolvedEffectMagnitude(state, effect.magnitude, source, effect)
  const modifierRowsForEffect = modifierRows(state, source, source.tags ?? [], ['barrier-power-percent'])
  const effective = Math.max(0, Math.round(base * Math.max(0, 1 + getCombatModifiers(state, 'player', 'barrier-power-percent', { source, sourceTags: source.tags }, 'unconditional'))))
  return { base, effective, changed: effective !== base, modifiers: modifierRowsForEffect.rows, conditionalModifiers: modifierRowsForEffect.conditional }
}

export const getEffectiveSpellCooldown = (state: SpellPresentationState, spellId: SpellId): EffectiveSpellValue => {
  const base = SPELLS[spellId].cooldownMs
  const recovery = getCooldownRecoveryMultiplier(state)
  const effective = recovery > 0 ? base / recovery : base
  return { base, effective, changed: effective !== base }
}

export const getEffectiveSpellManaCost = (state: SpellPresentationState, spellId: SpellId): EffectiveSpellValue => {
  const base = SPELLS[spellId].manaCost
  const effective = getEffectiveManaCost(state, base)
  return { base, effective, changed: effective !== base }
}

export const getEffectiveSpellFocusCost = (state: SpellPresentationState, base: number): EffectiveSpellValue => {
  const effective = getEffectiveFocusCost(state, base)
  return { base, effective, changed: effective !== base }
}

export const getEffectiveSpellPower = (state: SpellPresentationState) => getSpellPowerBreakdown(state)

/** Exposes conditional providers without folding them into generic Spellbook values. */
export const getSpellConditionalModifierPreview = (state: SpellPresentationState, spellId: SpellId, keys: ModifierKey[], tags: CombatTag[] = [], damageType?: DamageType, statusTags?: CombatTag[]) => {
  const source = getSpellPresentationSource(spellId)
  return modifierRows(state, source, uniqueTags(source.tags, tags), keys, damageType, statusTags).conditional
}

export const formatEffectiveSpellCooldown = (value: EffectiveSpellValue) => formatTime(value.effective)
export const formatSpellPreviewPercent = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value * 1000) / 10}%`
export const formatSpellPreviewCondition = conditionLabel
