import { SPELLS } from '../../content/spells/spells'
import { formatSpellRank, getSpellAutoCastFocusCost, type SpellRank } from '../../systems/spells'
import type { GameState, SchoolId, SpellId } from '../../types'
import { formatTime } from '../../utils'
import { buildSpellEffectTooltipModel, type SpellEffectTooltipModel, type SpellEffectTooltipRow } from './spellEffectTooltipModel'

export type SpellPresentationState = Pick<GameState, 'schools' | 'equipment' | 'progress' | 'activities'>

export interface SpellDetailPresentation {
  spellId: SpellId
  spellName: string
  school: SchoolId
  rankLabel: string
  description: string
  manaCost: number
  cooldownLabel: string
  autoCastFocus: number
  autoCastActive: boolean
  effects: SpellEffectTooltipModel[]
}

const SOURCE_ROW_LABEL = 'Source'
const INSPECTOR_INLINE_ROW_LIMIT = 6
const INLINE_ROW_PRIORITY: Record<string, number> = {
  Amount: 10, 'Base Damage': 10, 'Damage Per Tick': 10, 'Damage Taken': 10, 'Basic Attack Speed': 10, 'Action Speed': 10,
  'Air Damage Taken': 10, 'Current Base Preview': 20, 'School Scaling': 30, 'Current School Level': 35, Duration: 40,
  'Tick Interval': 45, 'Applied Stacks': 50, 'Max Stacks': 55, Target: 60, 'Damage Type': 70, Mode: 70, Stacking: 80, [SOURCE_ROW_LABEL]: 999,
}

export const getSpellbookTooltipRows = (model: SpellEffectTooltipModel): SpellEffectTooltipRow[] => model.rows.filter((row) => row.label !== SOURCE_ROW_LABEL)
const inlinePriority = (row: SpellEffectTooltipRow) => { if (INLINE_ROW_PRIORITY[row.label] !== undefined) return INLINE_ROW_PRIORITY[row.label]; if (row.label.endsWith('Damage Taken')) return INLINE_ROW_PRIORITY['Damage Taken']; return 90 }
export const getInspectorInlineEffectRows = (model: SpellEffectTooltipModel): SpellEffectTooltipRow[] => [...model.rows].map((row, index) => ({ row, index })).filter(({ row }) => row.label !== SOURCE_ROW_LABEL).sort((left, right) => inlinePriority(left.row) - inlinePriority(right.row) || left.index - right.index).slice(0, INSPECTOR_INLINE_ROW_LIMIT).sort((left, right) => left.index - right.index).map(({ row }) => row)

export function buildSpellDetailPresentation(state: SpellPresentationState, spellId: SpellId, rank: SpellRank): SpellDetailPresentation {
  const spell = SPELLS[spellId]
  return { spellId, spellName: spell.name, school: spell.school, rankLabel: formatSpellRank(rank), description: spell.description, manaCost: spell.manaCost, cooldownLabel: formatTime(spell.cooldownMs), autoCastFocus: getSpellAutoCastFocusCost(state, spellId) ?? 0, autoCastActive: Boolean(state.activities.autoCast[spellId]), effects: spell.effects.map((_, index) => buildSpellEffectTooltipModel(state, spellId, index)) }
}
