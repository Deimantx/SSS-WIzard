import { getFocusCapacityBreakdown } from './focusCapacity'
import { deriveFocusReservations } from './focusReservations'
import type { GameState } from '../../types'

export type FocusLoadoutState = Pick<GameState, 'player' | 'progress' | 'activities' | 'equipment' | 'artifactProgress'>

export interface FocusLoadoutValidation {
  valid: boolean
  maxFocus: number
  usedFocus: number
  deficit: number
}

/** Purely evaluates whether a candidate Equipment loadout can sustain its current reservations. */
export const validateFocusForEquipment = (state: FocusLoadoutState, equipment: GameState['equipment']): FocusLoadoutValidation => {
  const candidateState = { ...state, equipment }
  const maxFocus = getFocusCapacityBreakdown(candidateState).total
  const usedFocus = deriveFocusReservations(candidateState).reduce((sum, reservation) => sum + reservation.amount, 0)
  const deficit = Math.max(0, usedFocus - maxFocus)
  return { valid: deficit === 0, maxFocus, usedFocus, deficit }
}
