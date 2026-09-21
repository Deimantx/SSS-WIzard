import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { buildCombatSpellTilePresentation } from './combatSpellTilePresentation'

describe('combat spell tile presentation', () => {
  it('stays stable when only live cooldown state changes', () => {
    const state = createInitialState()
    const baseline = buildCombatSpellTilePresentation(state, 'fire-bolt', 1)
    const liveState = {
      ...state,
      combat: {
        ...state.combat,
        spellCooldowns: { ...state.combat.spellCooldowns, 'fire-bolt': 420 },
        pendingPlayerSpellCast: null,
      },
    }

    expect(buildCombatSpellTilePresentation(liveState, 'fire-bolt', 1)).toEqual(baseline)
  })
})
