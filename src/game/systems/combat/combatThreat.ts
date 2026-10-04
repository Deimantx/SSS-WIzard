import { COMBAT_LOCATIONS, hasBossEncounter } from '../../content/combat-locations/worldNavigation'
import { getCombatEncounterMode, getCombatLocationById, usesPowerBasedThreat } from '../../content/combat-locations'
import { resolveEnemyPowerRating } from '../../presentation/combat/enemyPowerRating'
import type { CombatLocationId, GameState, MonsterId } from '../../types'

/** Historical kill-count thresholds used only while migrating pre-v43 active runs. */
export const LEGACY_POWER_THREAT_REQUIREMENTS: Partial<Record<CombatLocationId, number>> = {
  'whispering-woods': 20,
  'howling-den': 25,
}

export const resolveBossThreatRequirement = (locationId: CombatLocationId) => {
  const dungeon = COMBAT_LOCATIONS[locationId]
  if (!dungeon || !hasBossEncounter(dungeon)) return 0
  const location = getCombatLocationById(locationId)
  return Math.max(0, Math.round(dungeon.threatRequired))
}

export const resolveThreatGainForKill = (state: GameState, enemyId: MonsterId) => {
  const locationId = state.combat.locationId
  if (!locationId) return 0
  const dungeon = COMBAT_LOCATIONS[locationId]
  if (!dungeon || !hasBossEncounter(dungeon)) return 0
  const location = getCombatLocationById(locationId)
  if (getCombatEncounterMode(location) === 'sequence') return 0
  return usesPowerBasedThreat(location) ? resolveEnemyPowerRating(enemyId) : 1
}
