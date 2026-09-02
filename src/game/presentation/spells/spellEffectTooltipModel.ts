import { STATUS_DEFINITIONS } from '../../content/statuses'
import { SPELLS } from '../../content/spells/spells'
import { getSpellEquipmentBonusPreview } from '../../systems/spells/spellEquipmentPreview'
import { getSpellPower } from '../../systems/spells/spellPower'
import { scaleMagnitude } from '../../systems/combat/combatTypes'
import type { CombatEffect, CombatModifier, Magnitude } from '../../systems/combat/combatTypes'
import type { GameState, SchoolId, SpellId } from '../../types'
import { formatTime } from '../../utils'
import { getEffectiveAppliedStatusModifiers } from '../combat/statusEffectPresentation'

export type SpellEffectTooltipSemantic = 'mana' | 'time' | 'focus' | 'positive' | 'negative' | 'school' | 'neutral'
export type SpellEffectTooltipCategoryKey = 'damage' | 'heal' | 'barrier' | 'buff' | 'debuff' | 'control' | 'dot' | 'effect'

export interface SpellEffectTooltipRow {
  label: string
  value: string
  semantic?: SpellEffectTooltipSemantic
}

export interface SpellEffectTooltipModel {
  school: SchoolId
  category: string
  categoryKey: SpellEffectTooltipCategoryKey
  title: string
  description: string
  rows: SpellEffectTooltipRow[]
}

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
const equipmentRows = (state: Pick<GameState, 'equipment'>, spellId: SpellId): SpellEffectTooltipRow[] => getSpellEquipmentBonusPreview(state, spellId).current.map((modifier) => ({ label: modifier.itemName, value: formatSignedPercent(modifier.value), semantic: modifier.value >= 0 ? 'positive' : 'negative' }))

const appendTargetAndSource = (rows: SpellEffectTooltipRow[], effect: CombatEffect, spellName: string) => {
  rows.push({ label: 'Target', value: targetLabel(effect.target) })
  rows.push({ label: 'Source', value: spellName })
}

export function buildSpellEffectTooltipModel(state: Pick<GameState, 'schools' | 'equipment'>, spellId: SpellId, effectIndex: number): SpellEffectTooltipModel {
  const spell = SPELLS[spellId]
  const effect = spell.effects[effectIndex]
  const category = getSpellEffectCategory(effect)
  const rows: SpellEffectTooltipRow[] = []

  if (effect.type === 'deal-damage') {
    const damageTypes = effect.components.map((component) => component.damageType)
    const damageType = damageTypes.length === 1 ? capitalize(damageTypes[0]) : 'Split'
    effect.components.forEach((component, index) => {
      const componentLabel = effect.components.length === 1 ? 'Base Damage' : `${capitalize(component.damageType)} Damage`
      const magnitude = component.magnitude
      if (magnitude.type === 'spell-power') {
        rows.push({ label: 'Scaling', value: formatSpellMagnitude(magnitude), semantic: 'school' })
        rows.push({ label: componentLabel, value: formatValue(getSpellPower(state) * magnitude.coefficient), semantic: 'school' })
      } else if (magnitude.type === 'school-level') {
        const level = state.schools[magnitude.school]?.level ?? 0
        rows.push({ label: componentLabel, value: formatValue(magnitude.base), semantic: 'school' })
        rows.push({ label: 'School Scaling', value: `+${formatValue(magnitude.perLevel)} / ${capitalize(magnitude.school)} Level`, semantic: 'school' })
        rows.push({ label: 'Current School Level', value: `${level}`, semantic: 'school' })
        rows.push({ label: 'Current Base Preview', value: formatValue(magnitude.base + level * magnitude.perLevel), semantic: 'school' })
      } else rows.push({ label: componentLabel, value: formatSpellMagnitude(magnitude), semantic: 'school' })
      if (effect.components.length === 1) rows.push({ label: 'Damage Type', value: `${capitalize(component.damageType)} Damage`, semantic: 'school' })
      else if (index === 0) rows.push({ label: 'Damage Types', value: damageTypes.map((type) => `${capitalize(type)} Damage`).join(' + '), semantic: 'school' })
    })
    appendTargetAndSource(rows, effect, spell.name)
    rows.push(...equipmentRows(state, spellId))
    return { school: spell.school, ...category, title: `${damageType} Damage`, description: `Deals ${damageType} damage when this Spell resolves.`, rows }
  }

  if (effect.type === 'heal') {
    if (effect.magnitude.type === 'spell-power') {
      rows.push({ label: 'Scaling', value: formatSpellMagnitude(effect.magnitude), semantic: 'school' })
      rows.push({ label: 'Amount', value: formatValue(Math.round(getSpellPower(state) * effect.magnitude.coefficient)), semantic: 'school' })
    } else rows.push({ label: 'Amount', value: formatSpellMagnitude(effect.magnitude) })
    appendTargetAndSource(rows, effect, spell.name)
    return { school: spell.school, ...category, title: 'Healing', description: 'Restores Health to the selected target.', rows }
  }

  if (effect.type === 'gain-barrier') {
    if (effect.magnitude.type === 'spell-power') {
      rows.push({ label: 'Scaling', value: formatSpellMagnitude(effect.magnitude), semantic: 'school' })
      rows.push({ label: 'Amount', value: formatValue(Math.round(getSpellPower(state) * effect.magnitude.coefficient)), semantic: 'school' })
    } else rows.push({ label: 'Amount', value: formatSpellMagnitude(effect.magnitude) })
    if (effect.durationMs !== undefined && effect.durationMs !== null) rows.push({ label: 'Duration', value: formatTime(effect.durationMs), semantic: 'time' })
    rows.push({ label: 'Mode', value: effect.mode === 'replace' ? 'Replace' : 'Add' })
    appendTargetAndSource(rows, effect, spell.name)
    rows.push(...equipmentRows(state, spellId))
    return { school: spell.school, ...category, title: 'Barrier', description: effect.mode === 'replace' ? 'Replaces the current Barrier on the target.' : 'Adds to the current Barrier on the target.', rows }
  }

  if (effect.type === 'apply-status') {
    const status = STATUS_DEFINITIONS[effect.statusId]
    const durationMs = effect.durationMs === undefined ? status?.defaultDurationMs ?? null : effect.durationMs
    getEffectiveAppliedStatusModifiers(effect.statusId, effect.modifierOverrides).forEach((modifier) => rows.push({ label: modifierLabel(modifier), value: modifierValue(modifier), semantic: modifier.value >= 0 ? 'positive' : 'negative' }))
    const periodicEffects = effect.periodicEffects ?? status?.periodic?.effects
    const periodicDamageEffects = periodicEffects?.filter((entry) => entry.type === 'deal-damage') ?? []
    const periodicDamageComponents = periodicDamageEffects.flatMap((entry) => entry.components)
    const intervalMs = status?.periodic?.intervalMs ?? 0
    const tickCount = durationMs !== null && intervalMs > 0 ? Math.floor(durationMs / intervalMs) : 0
    const multipleComponents = periodicDamageComponents.length > 1
    periodicDamageComponents.forEach((periodicComponent) => {
      const componentPrefix = multipleComponents ? `${capitalize(periodicComponent.damageType)} ` : ''
      if (periodicComponent.magnitude.type === 'spell-power' && tickCount > 0) {
        const totalMagnitude = scaleMagnitude(periodicComponent.magnitude, tickCount)
        const totalCoefficient = periodicComponent.magnitude.coefficient * tickCount
        rows.push({ label: `${componentPrefix}Scaling`.trim(), value: `${formatSpellMagnitude(totalMagnitude)} over ${formatTime(durationMs!)}`, semantic: 'school' })
        rows.push({ label: `${componentPrefix}Total Base Damage`.trim(), value: formatValue(getSpellPower(state) * totalCoefficient), semantic: 'school' })
        rows.push({ label: `${componentPrefix}Damage Per Tick`.trim(), value: formatValue(getSpellPower(state) * periodicComponent.magnitude.coefficient), semantic: 'school' })
      } else {
        rows.push({ label: `${componentPrefix}Damage Per Tick`.trim(), value: formatSpellMagnitude(periodicComponent.magnitude), semantic: 'school' })
        if (durationMs !== null && tickCount > 0 && periodicComponent.magnitude.type === 'flat') rows.push({ label: `${componentPrefix}Total Base Damage`.trim(), value: formatValue(periodicComponent.magnitude.value * tickCount), semantic: 'school' })
      }
    })
    if (periodicDamageComponents.length === 1) rows.push({ label: 'Damage Type', value: `${capitalize(periodicDamageComponents[0].damageType)} Damage`, semantic: 'school' })
    else if (periodicDamageComponents.length > 1) rows.push({ label: 'Damage Types', value: periodicDamageComponents.map((component) => `${capitalize(component.damageType)} Damage`).join(' + '), semantic: 'school' })
    if (periodicDamageComponents.length > 0) rows.push({ label: 'Tick Interval', value: formatTime(intervalMs), semantic: 'time' })
    periodicEffects?.filter((entry) => entry.type !== 'deal-damage').forEach((periodicEffect) => {
      if ('magnitude' in periodicEffect) rows.push({ label: `Periodic ${capitalize(periodicEffect.type.replace(/-/g, ' '))}`, value: formatSpellMagnitude(periodicEffect.magnitude), semantic: 'positive' })
      else rows.push({ label: 'Periodic Effect', value: capitalize(periodicEffect.type.replace(/-/g, ' ')), semantic: 'neutral' })
    })
    if (effect.stacks !== undefined) rows.push({ label: 'Applied Stacks', value: `${effect.stacks}` })
    if (status?.stacking.maxStacks !== undefined) rows.push({ label: 'Max Stacks', value: `${status.stacking.maxStacks}` })
    if (status) rows.push({ label: 'Stacking', value: stackingLabel(status.stacking.mode) })
    if (durationMs !== null) rows.push({ label: 'Duration', value: formatTime(durationMs), semantic: 'time' })
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
