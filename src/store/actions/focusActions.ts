import { canReserveFocus as canReserveFocusNormal, selectFreeFocus, selectUsedFocus } from '../../game/engine'
import type { GameState } from '../../game/types'

export const canReserveFocusAction = (state: GameState, amount: number) => state.debug.allowFocusOverCap || canReserveFocusNormal(state, amount)
export const getFocusAllocation = (state: GameState) => ({ used: selectUsedFocus(state), free: selectFreeFocus(state), max: state.player.maxFocus })

