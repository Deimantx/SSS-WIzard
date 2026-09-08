import { STATUS_DEFINITIONS } from '../../content/statuses'
import { SPELLS } from '../../content/spells/spells'
import type { CombatEffect, CombatModifier, Magnitude } from '../../systems/combat/combatTypes'
import type { SchoolId, SpellId } from '../../types'
import { formatTime } from '../../utils'
import { getEffectiveAppliedStatusModifiers } from '../combat/statusEffectPresentation'
import {
  getEffectiveSpellBarrierPreview,
  getEffectiveSpellDirectDamagePreview,
  getEffectiveSpellDotPreview,
  getEffectiveSpellHealingPreview,
  getEffectiveSpellStatusDurationPreview,
  type SpellPresentationState,
  type SpellPreviewModifier,
} from './effectiveSpellPresentation'
import { scaleMagnitude } from '../../systems/combat/combatTypes'

export type SpellEffectTooltipSemantic = 'mana' | 'time' | 'focus' | 'positive' | 'negative' | 'school' | 'neutral'
export type SpellEffectTooltipCategoryKey = 'damage' | 'heal' | 'barrier' | 'buff' | 'debuff' | 'control' | 'dot' | 'effect'
export type SpellTooltipDetailLevel = 'core' | 'advanced'

export interface SpellEffectTooltipRow {
  label: string
  value: string
  semantic?: SpellEffectTooltipSemantic
  /** Omitted rows are core information; advanced rows are revealed with Alt. */
  detailLevel?: SpellTooltipDetailLevel
}

export interface SpellEffectTooltipModel {
  school: SchoolId
  category: string
  categoryKey: SpellEffectTooltipCategoryKey
  title: string
  description: string
  rows: SpellEffectTooltipRow[]
}

export const getCompactSpellEffectRows = (model: SpellEffectTooltipModel): SpellEffectTooltipRow[] => model.rows.filter((row) => row.detailLevel !== 'advanced')
export const getExpandedSpellEffectRows = (model: SpellEffectTooltipModel): SpellEffectTooltipRow[] => model.rows
export const hasAdvancedSpellEffectRows = (model: SpellEffectTooltipModel) => model.rows.some((row) => row.detailLevel === 'advanced')

const capitalize = (value: string) => `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`
const targetLabel = (target: 'self' | 'opponent') => target === 'self' ? 'Self' : 'Enemy'
const formatValue = (value: number) => {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1)
}
const formatSignedPercent = (value: number) => `${value >= 0 ? '+' : ''}${formatValue(value * 100)}%`

export const formatSpellMagnitude = (magnitude: Magnitude) => {
  if (magnitude.type === 'flat') return formatValue(magnitude.value)
  if (magnitude.type === 'spell-power') return `${formatValue(magnitude.coefficient * 100)}% Spell Power`
  if (magnitude.type === 'school-level') return `${formatValue(magnitude.base)} + ${formatValue(magnitude.perLevel)} per ${capitalize(magnitude.school)} School Level`
  if (magnitude.type === 'source-max-health-percent') return `${formatValue(magnitude.value * 100)}% of Max Health`
  if (magnitude.type === 'target-max-health-percent') return `${formatValue(magnitude.value * 100)}% of target Max Health`
  if (magnitude.type === 'source-basic-damage-percent') return `${formatValue(magnitude.value * 100)}% of Basic Damage`
  return `${formatValue(magnitude.value * 100)}% of missing Health`
}

const categoryForStatus = (statusId: keyof typeof STATUS_DEFINITIONS, effect: Extract<CombatEffect, { type: 'apply-status' }>) => {
  const status = STATUS_DEFINITIONS[statusId]
  const tags = new Set([...(status?.tags ?? []), ...(effect.tags ?? [])])
  if (tags.has('dot') || status?.periodic) return { category: 'DOT', categoryKey: 'dot' as const }
  if (tags.has('control')) return { category: 'CONTROL', categoryKey: 'control' as const }
  if (status?.classification === 'buff' || tags.has('buff')) return { category: 'BUFF', categoryKey: 'buff' as const }
  if (status?.classification === 'debuff' || tags.has('debuff')) return { category: 'DEBUFF', categoryKey: 'debuff' as const }
  return { category: 'STATUS', categoryKey: 'effect' as const }
}

export const getSpellEffectCategory = (effect: CombatEffect) => {
  if (effect.type === 'deal-damage') return { category: 'DAMAGE', categoryKey: 'damage' as const }
  if (effect.type === 'heal') return { category: 'HEAL', categoryKey: 'heal' as const }
  if (effect.type === 'gain-barrier') return { category: 'BARRIER', categoryKey: 'barrier' as const }
  if (effect.type === 'apply-status') return categoryForStatus(effect.statusId, effect)
  return { category: effect.type === 'restore-resource' ? 'RESTORE' : effect.type === 'drain-resource' ? 'DRAIN' : 'EFFECT', categoryKey: 'effect' as const }
}

const modifierLabel = (modifier: CombatModifier) => {
  const labels: Partial<Record<CombatModifier['key'], string>> = {
    'basic-attack-speed-percent': 'Basic Attack Speed',
    'action-speed-percent': 'Action Speed',
    'damage-taken-percent': modifier.damageTypes?.length ? `${capitalize(modifier.damageTypes[0])} Damage Taken` : 'Damage Taken',
    'spell-damage-percent': 'Spell Damage',
    'healing-done-percent': 'Healing Done',
    'barrier-power-percent': 'Barrier Power',
    'status-duration-dealt-percent': 'Status Duration',
  }
  return labels[modifier.key] ?? capitalize(modifier.key.replace(/-percent$/, '').replace(/-/g, ' '))
}

const modifierValue = (modifier: CombatModifier) => `${formatSignedPercent(modifier.value)}${modifier.perStack ? ' per stack' : ''}`
const stackingLabel = (mode: string) => mode === 'stacks' ? 'Stacks' : `${mode[0].toUpperCase()}${mode.slice(1)}`

const appendTargetAndSource = (rows: SpellEffectTooltipRow[], effect: CombatEffect, spellName: string) => {
  rows.push({ label: 'Target', value: targetLabel(effect.target), detailLevel: 'advanced' })
  rows.push({ label: 'Source', value: spellName, detailLevel: 'advanced' })
}

const appendPreviewModifiers = (rows: SpellEffectTooltipRow[], modifiers: SpellPreviewModifier[], showSource = false) => {
  modifiers.forEach((modifier) => rows.push({
    label: showSource && modifier.sourceName ? modifier.sourceName : modifier.label,
    value: formatSignedPercent(modifier.value),
    semantic: modifier.value >= 0 ? 'positive' : 'negative',
    detailLevel: 'advanced',
  }))
}

const appendConditionalModifiers = (rows: SpellEffectTooltipRow[], modifiers: SpellPreviewModifier[]) => {
  modifiers.forEach((modifier) => rows.push({
    label: `Conditional: ${modifier.label}`,
    value: `${formatSignedPercent(modifier.value)}${modifier.condition ? ` · ${modifier.condition}` : ''}`,
    semantic: modifier.value >= 0 ? 'positive' : 'negative',
    detailLevel: 'advanced',
  }))
}

const appendEffectiveAmount = (rows: SpellEffectTooltipRow[], label: string, base: number, effective: number, semantic: SpellEffectTooltipSemantic = 'school', baseLabel = `Base ${label}`, showBaseWhenUnchanged = false) => {
  if (effective !== base) {
    rows.push({ label, value: formatValue(effective), semantic })
    rows.push({ label: baseLabel, value: formatValue(base), semantic: 'neutral', detailLevel: 'advanced' })
  } else {
    rows.push({ label, value: formatValue(base), semantic })
    if (showBaseWhenUnchanged) rows.push({ label: baseLabel, value: formatValue(base), semantic: 'neutral', detailLevel: 'advanced' })
  }
}

export function buildSpellEffectTooltipModel(state: SpellPresentationState, spellId: SpellId, effectIndex: number): SpellEffectTooltipModel {
  const spell = SPELLS[spellId]
  const effect = spell.effects[effectIndex]
  const category = getSpellEffectCategory(effect)
  const rows: SpellEffectTooltipRow[] = []

  if (effect.type === 'deal-damage') {
    const damageTypes = effect.components.map((component) => component.damageType)
    const damageType = damageTypes.length === 1 ? capitalize(damageTypes[0]) : 'Split'
    effect.components.forEach((component, index) => {
      const preview = getEffectiveSpellDirectDamagePreview(state, spellId, effect, component)
      const componentLabel = effect.components.length === 1 ? 'Damage' : `${capitalize(component.damageType)} Damage`
      if (component.magnitude.type === 'spell-power') rows.push({ label: 'Scaling', value: formatSpellMagnitude(component.magnitude), semantic: 'school', detailLevel: 'advanced' })
      if (component.magnitude.type === 'school-level') {
        const level = state.schools[component.magnitude.school]?.level ?? 0
        rows.push({ label: 'School Scaling', value: `+${formatValue(component.magnitude.perLevel)} / ${capitalize(component.magnitude.school)} Level`, semantic: 'school', detailLevel: 'advanced' })
        rows.push({ label: 'Current School Level', value: `${level}`, semantic: 'school', detailLevel: 'advanced' })
      }
      appendEffectiveAmount(rows, componentLabel, preview.base, preview.effective, 'school', effect.components.length === 1 ? 'Base Damage' : `${capitalize(component.damageType)} Base Damage`, true)
      if (effect.components.length === 1) rows.push({ label: 'Damage Type', value: `${capitalize(component.damageType)} Damage`, semantic: 'school' })
      else if (index === 0) rows.push({ label: 'Damage Types', value: damageTypes.map((type) => `${capitalize(type)} Damage`).join(' + '), semantic: 'school' })
      appendPreviewModifiers(rows, preview.modifiers, true)
      appendConditionalModifiers(rows, preview.conditionalModifiers)
    })
    appendTargetAndSource(rows, effect, spell.name)
    return { school: spell.school, ...category, title: `${damageType} Damage`, description: `Deals ${damageType} damage when this Spell resolves.`, rows }
  }

  if (effect.type === 'heal') {
    if (effect.magnitude.type === 'spell-power') rows.push({ label: 'Scaling', value: formatSpellMagnitude(effect.magnitude), semantic: 'school', detailLevel: 'advanced' })
    const preview = getEffectiveSpellHealingPreview(state, spellId, effect)
    appendEffectiveAmount(rows, 'Amount', preview.base, preview.effective)
    if (preview.effective !== preview.base) {
      appendPreviewModifiers(rows, preview.modifiers ?? [])
    }
    appendConditionalModifiers(rows, preview.conditionalModifiers ?? [])
    appendTargetAndSource(rows, effect, spell.name)
    return { school: spell.school, ...category, title: 'Healing', description: 'Restores Health to the selected target.', rows }
  }

  if (effect.type === 'gain-barrier') {
    if (effect.magnitude.type === 'spell-power') rows.push({ label: 'Scaling', value: formatSpellMagnitude(effect.magnitude), semantic: 'school', detailLevel: 'advanced' })
    const preview = getEffectiveSpellBarrierPreview(state, spellId, effect)
    appendEffectiveAmount(rows, 'Amount', preview.base, preview.effective)
    if (preview.effective !== preview.base) {
      appendPreviewModifiers(rows, preview.modifiers ?? [])
    }
    appendConditionalModifiers(rows, preview.conditionalModifiers ?? [])
    if (effect.durationMs !== undefined && effect.durationMs !== null) rows.push({ label: 'Duration', value: formatTime(effect.durationMs), semantic: 'time' })
    rows.push({ label: 'Mode', value: effect.mode === 'replace' ? 'Replace' : 'Add' })
    appendTargetAndSource(rows, effect, spell.name)
    return { school: spell.school, ...category, title: 'Barrier', description: effect.mode === 'replace' ? 'Replaces the current Barrier on the target.' : 'Adds to the current Barrier on the target.', rows }
  }

  if (effect.type === 'apply-status') {
    const status = STATUS_DEFINITIONS[effect.statusId]
    const durationPreview = getEffectiveSpellStatusDurationPreview(state, spellId, effect)
    getEffectiveAppliedStatusModifiers(effect.statusId, effect.modifierOverrides).forEach((modifier) => rows.push({ label: modifierLabel(modifier), value: modifierValue(modifier), semantic: modifier.value >= 0 ? 'positive' : 'negative' }))
    appendPreviewModifiers(rows, durationPreview.modifiers)
    appendConditionalModifiers(rows, durationPreview.conditionalModifiers)

    const periodicEffects = effect.periodicEffects ?? status?.periodic?.effects
    const periodicDamageEffects = periodicEffects?.filter((entry) => entry.type === 'deal-damage') ?? []
    const periodicDamageComponents = periodicDamageEffects.flatMap((entry) => entry.components.map((component) => ({ component, effect: entry })))
    const multipleComponents = periodicDamageComponents.length > 1
    periodicDamageComponents.forEach(({ component, effect: periodicEffect }) => {
      const preview = getEffectiveSpellDotPreview(state, spellId, effect, periodicEffect, component, durationPreview.effective)
      if (!preview) return
      const componentPrefix = multipleComponents ? `${capitalize(component.damageType)} ` : ''
      if (component.magnitude.type === 'spell-power') rows.push({ label: `${componentPrefix}Scaling`.trim(), value: `${formatSpellMagnitude(scaleMagnitude(component.magnitude, preview.fullTicks + preview.partialTickFraction))} over ${formatTime(durationPreview.effective)}`, semantic: 'school', detailLevel: 'advanced' })
      appendEffectiveAmount(rows, `${componentPrefix}Damage Per Tick`.trim(), preview.damagePerTick.base, preview.damagePerTick.effective, 'school', `${componentPrefix}Base Damage Per Tick`.trim())
      appendEffectiveAmount(rows, `${componentPrefix}Total Damage`.trim(), preview.totalDamage.base, preview.totalDamage.effective, 'school', `${componentPrefix}Total Base Damage`.trim(), true)
      appendPreviewModifiers(rows, preview.modifiers)
      appendConditionalModifiers(rows, preview.conditionalModifiers)
    })
    if (periodicDamageComponents.length === 1) rows.push({ label: 'Damage Type', value: `${capitalize(periodicDamageComponents[0].component.damageType)} Damage`, semantic: 'school' })
    else if (periodicDamageComponents.length > 1) rows.push({ label: 'Damage Types', value: periodicDamageComponents.map(({ component }) => `${capitalize(component.damageType)} Damage`).join(' + '), semantic: 'school' })
    const intervalMs = status?.periodic?.intervalMs ?? 0
    if (periodicDamageComponents.length > 0) rows.push({ label: 'Tick Interval', value: formatTime(intervalMs), semantic: 'time' })
    periodicEffects?.filter((entry) => entry.type !== 'deal-damage').forEach((periodicEffect) => {
      if ('magnitude' in periodicEffect) rows.push({ label: `Periodic ${capitalize(periodicEffect.type.replace(/-/g, ' '))}`, value: formatSpellMagnitude(periodicEffect.magnitude), semantic: 'positive' })
      else rows.push({ label: 'Periodic Effect', value: capitalize(periodicEffect.type.replace(/-/g, ' ')), semantic: 'neutral' })
    })
    if (effect.stacks !== undefined) rows.push({ label: 'Applied Stacks', value: `${effect.stacks}`, detailLevel: 'advanced' })
    if (status?.stacking.maxStacks !== undefined) rows.push({ label: 'Max Stacks', value: `${status.stacking.maxStacks}`, detailLevel: 'advanced' })
    if (status) rows.push({ label: 'Stacking', value: stackingLabel(status.stacking.mode), detailLevel: 'advanced' })
    if (durationPreview.effective !== durationPreview.base) {
      rows.push({ label: 'Duration', value: formatTime(durationPreview.effective), semantic: 'time' })
      rows.push({ label: 'Base Duration', value: formatTime(durationPreview.base), semantic: 'time', detailLevel: 'advanced' })
    } else if (durationPreview.base !== 0) rows.push({ label: 'Duration', value: formatTime(durationPreview.base), semantic: 'time' })
    appendTargetAndSource(rows, effect, spell.name)
    return { school: spell.school, ...category, title: status?.name ?? capitalize(effect.statusId), description: status?.description ?? 'Applies a combat status.', rows }
  }

  if (effect.type === 'restore-resource' || effect.type === 'drain-resource') {
    rows.push({ label: 'Amount', value: formatSpellMagnitude(effect.magnitude), semantic: 'mana' })
    rows.push({ label: 'Resource', value: capitalize(effect.resource), semantic: 'mana' })
    appendTargetAndSource(rows, effect, spell.name)
    return { school: spell.school, ...category, title: effect.type === 'restore-resource' ? 'Mana Restored' : 'Mana Drained', description: effect.type === 'restore-resource' ? 'Restores the selected resource.' : 'Drains the selected resource.', rows }
  }

  appendTargetAndSource(rows, effect, spell.name)
  return { school: spell.school, ...category, title: category.category, description: 'Applies an additional combat effect.', rows }
}
