import { SPELLS } from '../../content/spells/spells'
import { formatSpellRank, getSpellAutoCastFocusCost, type SpellRank } from '../../systems/spells'
import type { SchoolId, SpellId } from '../../types'
import { formatTime } from '../../utils'
import { buildSpellEffectTooltipModel, getCompactSpellEffectRows, getExpandedSpellEffectRows, type SpellEffectTooltipModel, type SpellEffectTooltipRow } from './spellEffectTooltipModel'
import { getEffectiveSpellCooldown, getEffectiveSpellManaCost, getEffectiveSpellPower, type SpellPresentationState } from './effectiveSpellPresentation'

export type { SpellPresentationState } from './effectiveSpellPresentation'

export interface SpellDetailPresentation {
  spellId: SpellId
  spellName: string
  school: SchoolId
  rankLabel: string
  description: string
  manaCost: number
  cooldownMs: number
  cooldownLabel: string
  autoCastFocus: number
  autoCastActive: boolean
  spellPower: number
  spellPowerBreakdown: ReturnType<typeof getEffectiveSpellPower>
  effects: SpellEffectTooltipModel[]
}

const SOURCE_ROW_LABEL = 'Source'
const INSPECTOR_INLINE_ROW_LIMIT = 6
const INLINE_ROW_PRIORITY: Record<string, number> = {
  Amount: 10, 'Base Damage': 10, 'Total Base Damage': 10, 'Damage Per Tick': 10, 'Damage Taken': 10, 'Basic Attack Speed': 10, 'Action Speed': 10,
  'Air Damage Taken': 10, Scaling: 20, Duration: 40,
  'Tick Interval': 45, 'Applied Stacks': 50, 'Max Stacks': 55, Target: 60, 'Damage Type': 70, Mode: 70, Stacking: 80, [SOURCE_ROW_LABEL]: 999,
}

/** Compact rows used by rich Spell tooltips before the player holds Alt. */
export const getSpellbookTooltipRows = (model: SpellEffectTooltipModel): SpellEffectTooltipRow[] => getCompactSpellEffectRows(model).filter((row) => row.label !== SOURCE_ROW_LABEL)
/** Full row set used by the expanded rich tooltip. */
export const getFullSpellTooltipRows = (model: SpellEffectTooltipModel): SpellEffectTooltipRow[] => getExpandedSpellEffectRows(model)
const inlinePriority = (row: SpellEffectTooltipRow) => { if (INLINE_ROW_PRIORITY[row.label] !== undefined) return INLINE_ROW_PRIORITY[row.label]; if (row.label.endsWith('Damage Taken')) return INLINE_ROW_PRIORITY['Damage Taken']; return 90 }
const inlineSupplementalPriority = (row: SpellEffectTooltipRow) => {
  if (row.label === 'Target') return 10
  if (row.label === 'Applied Stacks') return 20
  if (row.label === 'Max Stacks') return 25
  if (row.label === 'Mode') return 30
  if (row.label === 'Damage Type' || row.label === 'Damage Types') return 35
  return 40
}
const isInlineSupplementalRow = (row: SpellEffectTooltipRow) => row.label === 'Target' || row.label === 'Applied Stacks' || row.label === 'Max Stacks' || row.label === 'Mode' || row.label === 'Stacking' || row.label === 'Damage Type' || row.label === 'Damage Types' || row.label === 'Scaling' || row.label === 'School Scaling' || row.label === 'Current School Level' || row.label.startsWith('Base ')
export const getInspectorInlineEffectRows = (model: SpellEffectTooltipModel): SpellEffectTooltipRow[] => {
  const candidates = model.rows.map((row, index) => ({ row, index })).filter(({ row }) => row.label !== SOURCE_ROW_LABEL && !row.label.startsWith('Conditional:'))
  const core = candidates.filter(({ row }) => row.detailLevel !== 'advanced')
    .sort((left, right) => inlinePriority(left.row) - inlinePriority(right.row) || left.index - right.index)
  const supplemental = candidates.filter(({ row }) => row.detailLevel === 'advanced' && isInlineSupplementalRow(row))
    .sort((left, right) => inlineSupplementalPriority(left.row) - inlineSupplementalPriority(right.row) || left.index - right.index)
  const selected = [...core, ...supplemental].slice(0, INSPECTOR_INLINE_ROW_LIMIT)
  return selected.sort((left, right) => left.index - right.index).map(({ row }) => row)
}

export function buildSpellDetailPresentation(state: SpellPresentationState, spellId: SpellId, rank: SpellRank): SpellDetailPresentation {
  const spell = SPELLS[spellId]
  const mana = getEffectiveSpellManaCost(state, spellId)
  const cooldown = getEffectiveSpellCooldown(state, spellId)
  const spellPowerBreakdown = getEffectiveSpellPower(state)
  return { spellId, spellName: spell.name, school: spell.school, rankLabel: formatSpellRank(rank), description: spell.description, manaCost: mana.effective, cooldownMs: cooldown.effective, cooldownLabel: formatTime(cooldown.effective), autoCastFocus: getSpellAutoCastFocusCost(state, spellId) ?? 0, autoCastActive: Boolean(state.activities.autoCast[spellId]), spellPower: spellPowerBreakdown.total, spellPowerBreakdown, effects: spell.effects.map((_, index) => buildSpellEffectTooltipModel(state, spellId, index)) }
}
