import { SPELLS } from '../../content/spells/spells'
import type { CombatSource, SpellId } from '../../types'

/** A player Spell is direct when one of its authored top-level effects is direct. */
export const isDirectPlayerSpell = (spellId: SpellId) => Boolean(SPELLS[spellId]?.effects.some((effect) => 'tags' in effect && effect.tags?.includes('direct')))

/** The authored player Spell source used by both execution and presentation. */
export const getSpellCombatSource = (spellId: SpellId): CombatSource => {
  const spell = SPELLS[spellId]
  return { actor: 'player', kind: 'spell', sourceId: spell.id, school: spell.school, tags: ['spell', 'magic', spell.school] }
}
