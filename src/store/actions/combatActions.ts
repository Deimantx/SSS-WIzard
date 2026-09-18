import { requestManualSpell } from '../../game/engine/spellEngine'
import type { GameState, SpellId } from '../../game/types'
import type { CombatEventSink } from '../../game/systems/combat/combatTypes'

export const castSpellAction = (state: GameState, spellId: SpellId, uiEvents?: CombatEventSink) => {
  return requestManualSpell(state, spellId, uiEvents).ok
}

export const requestManualSpellAction = requestManualSpell
