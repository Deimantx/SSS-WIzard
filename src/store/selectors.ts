import { manaRegenPerSecond, playerBasicDamage, selectFreeFocus, selectUsedFocus } from '../game/engine'
import type { GameStore } from './gameStore'

export { selectUsedFocus, selectFreeFocus }
export const selectManaRegen = (state: GameStore) => manaRegenPerSecond(state)
export const selectPlayerBasicDamage = (state: GameStore) => playerBasicDamage(state)
export const selectAutoHuntUnlocked = (state: GameStore) => Boolean(state.progress.autoHuntBossUnlocked || (state.progress.bossKillsByBoss['grove-sentinel'] ?? 0) > 0 || state.progress.firstBossKill)
export const selectCombatStatus = (state: GameStore) => state.combat.active ? (state.combat.enemyId ? 'Combat Active' : 'Encounter Delay') : 'At the Tower'
export const selectTopbarStatus = (state: GameStore) => state.combat.active ? (state.combat.enemyId ? 'COMBAT' : 'RECOVERY') : 'AT TOWER'
export const selectOfflineBankMs = (state: GameStore) => state.offlineBankMs
