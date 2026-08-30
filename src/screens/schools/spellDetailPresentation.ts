import { SPELLS } from '../../game/content/spells/spells'
import { formatSpellRank, getSpellAutoCastFocusCost, type SpellRank } from '../../game/systems/spells'
import type { GameState, SchoolId, SpellId } from '../../game/types'
import { formatTime } from '../../game/utils'
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

export const getSpellbookTooltipRows = (model: SpellEffectTooltipModel): SpellEffectTooltipRow[] => model.rows.filter((row) => row.label !== SOURCE_ROW_LABEL)

export const getInspectorInlineEffectRows = (model: SpellEffectTooltipModel): SpellEffectTooltipRow[] => model.rows.filter((row) => row.label !== SOURCE_ROW_LABEL).slice(0, INSPECTOR_INLINE_ROW_LIMIT)

export function buildSpellDetailPresentation(state: SpellPresentationState, spellId: SpellId, rank: SpellRank): SpellDetailPresentation {
  const spell = SPELLS[spellId]
  return {
    spellId,
    spellName: spell.name,
    school: spell.school,
    rankLabel: formatSpellRank(rank),
    description: spell.description,
    manaCost: spell.manaCost,
    cooldownLabel: formatTime(spell.cooldownMs),
    autoCastFocus: getSpellAutoCastFocusCost(state, spellId) ?? 0,
    autoCastActive: Boolean(state.activities.autoCast[spellId]),
    effects: spell.effects.map((_, index) => buildSpellEffectTooltipModel(state, spellId, index)),
  }
}
