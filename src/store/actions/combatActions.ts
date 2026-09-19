import { requestManualSpell } from '../../game/engine/spellEngine'
import type { GameState, SpellId } from '../../game/types'
import type { CombatEventSink } from '../../game/systems/combat/combatTypes'

export const castSpellAction = (state: GameState, spellId: SpellId, uiEvents?: CombatEventSink) => {
  return requestManualSpell(state, spellId, uiEvents).ok
}

/** Explicit Developer Tools bypass; normal player requests remain loadout-bound. */
export const debugCastSpellAction = (state: GameState, spellId: SpellId, uiEvents?: CombatEventSink) => {
  return requestManualSpell(state, spellId, uiEvents, { ignoreCombatLoadout: true }).ok
}

export const requestManualSpellAction = requestManualSpell
