import { DUNGEONS, hasBossEncounter } from '../../content/combat-locations/dungeons/dungeons'
import { getCombatEncounterMode, getCombatLocationById, usesPowerBasedThreat } from '../../content/combat-locations'
import { resolveEnemyPowerRating } from '../../presentation/combat/enemyPowerRating'
import { getActiveEncounterWorldTier, getWorldTierDefinition } from '../world-tier/worldTierRuntime'
import type { CombatLocationId, GameState, MonsterId, WorldTierId } from '../../types'

/** Historical kill-count thresholds used only while migrating pre-v43 active runs. */
export const LEGACY_POWER_THREAT_REQUIREMENTS: Partial<Record<CombatLocationId, number>> = {
  'whispering-woods': 20,
  'howling-den': 25,
}

export const resolveBossThreatRequirement = (locationId: CombatLocationId, worldTier: WorldTierId) => {
  const dungeon = DUNGEONS[locationId]
  if (!dungeon || !hasBossEncounter(dungeon)) return 0
  const location = getCombatLocationById(locationId)
  const multiplier = usesPowerBasedThreat(location)
    ? getWorldTierDefinition(worldTier).bossThreatRequirementMultiplier
    : 1
  return Math.max(0, Math.round(dungeon.threatRequired * multiplier))
}

export const resolveThreatGainForKill = (state: GameState, enemyId: MonsterId, encounterWorldTier: WorldTierId = getActiveEncounterWorldTier(state)) => {
  const locationId = state.combat.locationId
  if (!locationId) return 0
  const dungeon = DUNGEONS[locationId]
  if (!dungeon || !hasBossEncounter(dungeon)) return 0
  const location = getCombatLocationById(locationId)
  if (getCombatEncounterMode(location) === 'sequence') return 0
  return usesPowerBasedThreat(location) ? resolveEnemyPowerRating(enemyId, encounterWorldTier) : 1
}
