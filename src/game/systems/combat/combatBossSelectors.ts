import { isDungeonUnlocked, type DungeonDefinition } from '../../content/dungeons/dungeons'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import type { DungeonId, GameState } from '../../types'

type CombatBossState = { combat: Pick<GameState['combat'], 'active' | 'dungeonId' | 'enemyId' | 'inBossFight' | 'pendingBossId' | 'threatCleared'> }
type DungeonProgressState = { progress: Pick<GameState['progress'], 'autoHuntBossUnlocked' | 'bossKillsByBoss' | 'firstBossKill' | 'autoHuntBossByDungeon'> }
type ManualBossState = { combat: CombatBossState['combat']; progress: DungeonProgressState['progress'] }

export function isBossCurrentlyActive(state: CombatBossState) {
  const enemy = state.combat.enemyId ? MONSTERS[state.combat.enemyId] : null
  return Boolean(state.combat.active && (state.combat.inBossFight || (enemy && isBossMonster(enemy))))
}

export function isAutoHuntUnlocked(progress: Pick<GameState['progress'], 'autoHuntBossUnlocked' | 'bossKillsByBoss' | 'firstBossKill'>) {
  return Boolean(progress.autoHuntBossUnlocked || Object.values(progress.bossKillsByBoss).some((kills) => kills > 0) || progress.firstBossKill)
}

export function isAutoHuntEnabledForDungeon(state: DungeonProgressState, dungeonId: DungeonId) {
  return isAutoHuntUnlocked(state.progress) && Boolean(state.progress.autoHuntBossByDungeon[dungeonId])
}

export function canManuallyEngageDungeonBoss(state: ManualBossState, dungeon: DungeonDefinition) {
  return Boolean(
    state.combat.active &&
    state.combat.dungeonId === dungeon.id &&
    isDungeonUnlocked(dungeon, state.progress) &&
    state.combat.threatCleared >= dungeon.threatRequired &&
    !isBossCurrentlyActive(state) &&
    !state.combat.pendingBossId &&
    !isAutoHuntEnabledForDungeon(state, dungeon.id),
  )
}
