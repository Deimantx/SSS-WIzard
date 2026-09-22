import { DUNGEONS } from '../../content/dungeons/dungeons'
import { getCombatEncounterMode, getCombatLocationByDungeonId, usesPowerBasedThreat } from '../../content/world-navigation'
import { resolveEnemyPowerRating } from '../../presentation/combat/enemyPowerRating'
import { getActiveEncounterWorldTier, getWorldTierDefinition } from '../world-tier/worldTierRuntime'
import type { DungeonId, GameState, MonsterId, WorldTierId } from '../../types'

/** Historical kill-count thresholds used only while migrating pre-v43 active runs. */
export const LEGACY_POWER_THREAT_REQUIREMENTS: Partial<Record<DungeonId, number>> = {
  'whispering-woods': 20,
  'howling-den': 25,
}

export const resolveBossThreatRequirement = (dungeonId: DungeonId, worldTier: WorldTierId) => {
  const dungeon = DUNGEONS[dungeonId]
  if (!dungeon) return 0
  const location = getCombatLocationByDungeonId(dungeonId)
  const multiplier = usesPowerBasedThreat(location)
    ? getWorldTierDefinition(worldTier).bossThreatRequirementMultiplier
    : 1
  return Math.max(0, Math.round(dungeon.threatRequired * multiplier))
}

export const resolveThreatGainForKill = (state: GameState, enemyId: MonsterId, encounterWorldTier: WorldTierId = getActiveEncounterWorldTier(state)) => {
  const location = getCombatLocationByDungeonId(state.combat.dungeonId)
  if (getCombatEncounterMode(location) === 'sequence') return 0
  return usesPowerBasedThreat(location) ? resolveEnemyPowerRating(enemyId, encounterWorldTier) : 1
}
