import { isCombatLocationUnlocked, type CombatLocationRuntimeView } from '../../content/combat-locations/worldNavigation'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import { resolveBossThreatRequirement } from './combatThreat'
import type { CombatLocationId, GameState } from '../../types'

type CombatBossState = { combat: Pick<GameState['combat'], 'active' | 'locationId' | 'enemyId' | 'inBossFight' | 'pendingBossId' | 'threatCleared'> }
type DungeonProgressState = { progress: Pick<GameState['progress'], 'autoHuntBossUnlocked' | 'bossKillsByBoss' | 'firstBossKill' | 'autoHuntBossByLocation'> }
type ManualBossState = { combat: CombatBossState['combat']; progress: DungeonProgressState['progress'] }

export function isBossCurrentlyActive(state: CombatBossState) {
  const enemy = state.combat.enemyId ? MONSTERS[state.combat.enemyId] : null
  return Boolean(state.combat.active && (state.combat.inBossFight || (enemy && isBossMonster(enemy))))
}

export function isAutoHuntUnlocked(progress: Pick<GameState['progress'], 'autoHuntBossUnlocked' | 'bossKillsByBoss' | 'firstBossKill'>) {
  return Boolean(progress.autoHuntBossUnlocked || Object.values(progress.bossKillsByBoss).some((kills) => kills > 0) || progress.firstBossKill)
}

export function isAutoHuntEnabledForDungeon(state: DungeonProgressState, locationId: CombatLocationId) {
  return isAutoHuntUnlocked(state.progress) && Boolean(state.progress.autoHuntBossByLocation[locationId])
}

export function canManuallyEngageDungeonBoss(state: ManualBossState, dungeon: CombatLocationRuntimeView) {
  return Boolean(
    state.combat.active &&
    state.combat.locationId === dungeon.id &&
    isCombatLocationUnlocked(dungeon, state.progress) &&
    state.combat.threatCleared >= resolveBossThreatRequirement(dungeon.id) &&
    !isBossCurrentlyActive(state) &&
    !state.combat.pendingBossId &&
    !isAutoHuntEnabledForDungeon(state, dungeon.id),
  )
}
