import { pushNotification } from '../../game/engine'
import { castSpellInternal } from '../../game/engine/spellEngine'
import type { GameState, SpellId } from '../../game/types'

export const castSpellAction = (state: GameState, spellId: SpellId) => {
  if (!state.progress.unlockedSpells.includes(spellId)) return false
  if (!state.combat.active) { pushNotification(state, 'Enter combat before using that spell', 'warning'); return false }
  return castSpellInternal(state, spellId)
}
