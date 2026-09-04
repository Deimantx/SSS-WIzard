import { manaRegenPerSecond, playerBasicDamage, selectFreeFocus, selectRawFreeFocus, selectUsedFocus } from '../game/engine'
import { getManaCapacityBreakdown, getManaRegenBreakdown } from '../game/engine/channelingEngine'
import { isAutoHuntUnlocked } from '../game/systems/combat/combatBossSelectors'
import type { GameStore } from './gameStore'

export { selectUsedFocus, selectFreeFocus, selectRawFreeFocus }
export const selectManaRegen = (state: GameStore) => manaRegenPerSecond(state)
export const selectManaRegenBreakdown = (state: GameStore) => getManaRegenBreakdown(state)
export const selectManaCapacityBreakdown = (state: GameStore) => getManaCapacityBreakdown(state)
export const selectPlayerBasicDamage = (state: GameStore) => playerBasicDamage(state)
export const selectAutoHuntUnlocked = (state: GameStore) => isAutoHuntUnlocked(state.progress)
export const selectCombatStatus = (state: GameStore) => state.combat.active ? (state.combat.enemyId ? 'Combat Active' : 'Encounter Delay') : 'At the Tower'
export const selectOfflineBankMs = (state: GameStore) => state.offlineBankMs
