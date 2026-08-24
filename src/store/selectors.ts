import { manaRegenPerSecond, playerBasicDamage, selectFreeFocus, selectFocusReservations, selectUsedFocus } from '../game/engine'
import type { GameStore } from './gameStore'

export { selectFocusReservations, selectUsedFocus, selectFreeFocus }
export const selectManaRegen = (state: GameStore) => manaRegenPerSecond(state)
export const selectPlayerBasicDamage = (state: GameStore) => playerBasicDamage(state)
export const selectCombatStatus = (state: GameStore) => state.combat.active ? (state.combat.enemyId ? 'Combat Active' : 'Encounter Delay') : 'At the Tower'
export const selectOfflineBankMs = (state: GameStore) => state.offlineBankMs
