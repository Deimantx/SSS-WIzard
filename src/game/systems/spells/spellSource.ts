import { SPELLS } from '../../content/spells/spells'
import type { CombatSource, SpellId } from '../../types'

/** The authored player Spell source used by both execution and presentation. */
export const getSpellCombatSource = (spellId: SpellId): CombatSource => {
  const spell = SPELLS[spellId]
  return { actor: 'player', kind: 'spell', sourceId: spell.id, school: spell.school, tags: ['spell', 'magic', spell.school] }
}
