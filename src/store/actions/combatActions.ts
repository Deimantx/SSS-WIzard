import { castSpellInternal, getSpellCastFailure, notifySpellCastFailure } from '../../game/engine/spellEngine'
import type { GameState, SpellId } from '../../game/types'

export const castSpellAction = (state: GameState, spellId: SpellId) => {
  if (!state.progress.unlockedSpells.includes(spellId)) return false
  const failure = getSpellCastFailure(state, spellId)
  if (failure) { notifySpellCastFailure(state, spellId, failure); return false }
  return castSpellInternal(state, spellId)
}
