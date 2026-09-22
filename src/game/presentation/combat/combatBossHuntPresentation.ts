import { type DungeonDefinition } from '../../content/dungeons/dungeons'
import { MONSTERS } from '../../content/monsters'
import type { CombatLocationType } from '../../content/world-navigation'
import { canManuallyEngageDungeonBoss, isAutoHuntEnabledForDungeon, isAutoHuntUnlocked, isBossCurrentlyActive } from '../../systems/combat/combatBossSelectors'
import type { GameState } from '../../types'

export type CombatBossHuntState = 'building' | 'ready' | 'queued' | 'fighting'

export interface CombatBossHuntPresentation {
  bossId: DungeonDefinition['boss']
  bossName: string
  bossLabel: 'ZONE BOSS' | 'ELITE BOSS' | 'FINAL BOSS'
  threatCurrent: number
  threatRequired: number
  remainingThreat: number
  progressPercent: number
  state: CombatBossHuntState
  canEngage: boolean
  autoHuntUnlocked: boolean
  autoHuntEnabled: boolean
  active: boolean
}

export const buildCombatBossHuntPresentation = ({ combat, progress, dungeon, locationType }: {
  combat: Pick<GameState['combat'], 'active' | 'dungeonId' | 'enemyId' | 'inBossFight' | 'pendingBossId' | 'threatCleared'>
  progress: Pick<GameState['progress'], 'autoHuntBossUnlocked' | 'bossKillsByBoss' | 'firstBossKill' | 'autoHuntBossByDungeon'>
  dungeon: DungeonDefinition
  locationType: CombatLocationType
}): CombatBossHuntPresentation => {
  const active = combat.active && combat.dungeonId === dungeon.id
  const threatCurrent = active ? Math.max(0, combat.threatCleared) : 0
  const threatRequired = dungeon.threatRequired
  const bossState = active ? { ...combat, threatCleared: threatCurrent } : { ...combat, active: false, dungeonId: dungeon.id, enemyId: null, inBossFight: false, pendingBossId: null, threatCleared: 0 }
  const fighting = isBossCurrentlyActive({ combat: bossState })
  const queued = active && combat.pendingBossId === dungeon.boss && !fighting
  const ready = active && threatCurrent >= threatRequired && !fighting && !queued
  const autoHuntUnlocked = isAutoHuntUnlocked(progress)
  const autoHuntEnabled = isAutoHuntEnabledForDungeon({ progress }, dungeon.id)
  const bossLabel: CombatBossHuntPresentation['bossLabel'] = locationType === 'elite-zone' ? 'ELITE BOSS' : locationType === 'dungeon' ? 'FINAL BOSS' : 'ZONE BOSS'
  return {
    bossId: dungeon.boss,
    bossName: MONSTERS[dungeon.boss]?.name ?? dungeon.boss,
    bossLabel,
    threatCurrent,
    threatRequired,
    remainingThreat: Math.max(0, threatRequired - threatCurrent),
    progressPercent: Math.min(100, threatCurrent / Math.max(1, threatRequired) * 100),
    state: fighting ? 'fighting' : queued ? 'queued' : ready ? 'ready' : 'building',
    canEngage: canManuallyEngageDungeonBoss({ combat: bossState, progress }, dungeon),
    autoHuntUnlocked,
    autoHuntEnabled,
    active,
  }
}
