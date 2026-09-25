import { createInitialState } from '../../../store/initialState'
import { createSpellPresetAction, saveSpellPresetAction } from '../../../store/actions/spellPresetActions'
import type { GameState } from '../../types'

/** Builds a deterministic combat fixture using the current Spell Preset API. */
export const createCombatTestState = (): GameState => {
  const state = createInitialState()
  state.combat.targetEnemyId = 'forest-wisp'
  state.progress.spellRanks['fire-bolt'] = 1
  const presetId = createSpellPresetAction(state, 'Combat Test')
  saveSpellPresetAction(state, { id: presetId, name: 'Combat Test', slots: [{ spellId: 'fire-bolt', autoCast: false }] })
  return state
}
