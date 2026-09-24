import { SPELLS } from '../../content/spells/spells'
import type { SpellId } from '../../types'
import { getCombatModifiers, type CombatModifierState as ModifierState } from '../combat/modifiers'
import { getSpellCombatSource } from './spellSource'

export const getSpellCastTimeMultiplier = (state: ModifierState, spellId: SpellId) => {
  const source = getSpellCombatSource(spellId)
  const modifier = getCombatModifiers(state, 'player', 'spell-cast-time-percent', { source, sourceTags: source.tags, damageType: source.school })
  return Math.max(0.1, 1 + modifier)
}

export const getEffectiveSpellCastTimeMs = (state: ModifierState, spellId: SpellId) => Math.max(1, SPELLS[spellId].castTimeMs * getSpellCastTimeMultiplier(state, spellId))
