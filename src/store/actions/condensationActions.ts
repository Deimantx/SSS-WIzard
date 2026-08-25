import { BALANCE } from '../../game/core/balance/balance'
import { canReserveFocusAction } from './focusActions'
import { pushNotification } from '../../game/engine'
import type { GameState, SchoolId } from '../../game/types'

export const toggleCondensationAction = (state: GameState, element: SchoolId) => {
  const activity = state.activities.condense
  if (activity.running) { activity.running = false; return }
  if (!canReserveFocusAction(state, BALANCE.condense.focusCost)) { pushNotification(state, `Cannot start Condensation - Requires ${BALANCE.condense.focusCost} Focus`, 'warning'); return }
  if (state.player.mana < BALANCE.condense.manaCost) { pushNotification(state, 'Cannot start Condensation - Not enough Mana', 'warning'); return }
  activity.element = element
  state.player.mana -= BALANCE.condense.manaCost
  activity.running = true
  activity.progressMs = 0
}

