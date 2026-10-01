import type { GameState, MonsterId } from '../../types'
import { MONSTERS } from '../monsters'
import { getElementMultiplier } from '../elements/elements'
import type { BossCombatLocationRuntimeView, CombatEncounterMode, CombatLocationDefinition, CombatLocationId, CombatLocationRuntimeView, CombatRegionDefinition } from './worldNavigationTypes'
import { COMBAT_LOCATION_IDS } from './combatLocationIds'
import { COMBAT_LOCATIONS, COMBAT_LOCATION_ORDER } from './registry'
import { COMBAT_REGIONS } from './regions'

export { COMBAT_LOCATIONS, COMBAT_LOCATION_ORDER }
export { COMBAT_REGIONS }
export type { CombatLocationRuntimeView } from './worldNavigationTypes'

export const getCombatLocation = (locationId: CombatLocationId | null | undefined): CombatLocationRuntimeView | null => locationId ? COMBAT_LOCATIONS[locationId] ?? null : null
export const getCombatLocationById = getCombatLocation

type NavigationProgress = Pick<GameState['progress'], 'bossKillsByBoss'> & Partial<Pick<GameState['progress'], 'startingSchoolId' | 'chronicle'>>

export const isCombatNavigationConditionUnlocked = (condition: CombatLocationDefinition['unlock'] | CombatRegionDefinition['unlock'], progress: NavigationProgress): boolean => {
  if (!condition || condition.type === 'always') return true
  if (condition.type === 'boss-kill') return (progress.bossKillsByBoss[condition.bossId] ?? 0) >= (condition.count ?? 1)
  if (condition.type === 'all-boss-kills') return condition.bossIds.every((bossId) => (progress.bossKillsByBoss[bossId] ?? 0) >= 1)
  if (condition.type === 'chronicle-event') return progress.chronicle?.eventFlags[condition.eventId] === true
  if (condition.type === 'starter-advantage') {
    if (!progress.startingSchoolId) return false
    return getElementMultiplier(progress.startingSchoolId, condition.targetElement) > 1
  }
  if (condition.type === 'any') return condition.conditions.some((entry) => isCombatNavigationConditionUnlocked(entry, progress))
  return condition.conditions.every((entry) => isCombatNavigationConditionUnlocked(entry, progress))
}

export const isCombatLocationUnlocked = (locationRef: CombatLocationId | CombatLocationDefinition, progress: NavigationProgress): boolean => {
  const locationId = typeof locationRef === 'string' ? locationRef : locationRef.id
  const location = COMBAT_LOCATIONS[locationId]
  const region = location && COMBAT_REGIONS[location.regionId]
  if (!location || !region || !isCombatNavigationConditionUnlocked(region.unlock, progress) || !isCombatNavigationConditionUnlocked(location.unlock, progress)) return false
  return !location.prototype
}

export const isCombatLocationCompleted = (locationId: CombatLocationId, progress: GameState['progress']): boolean => {
  const location = COMBAT_LOCATIONS[locationId]
  return location.bossId !== null && (progress.bossKillsByBoss[location.bossId] ?? 0) > 0
}

export const isTutorialCompleted = (progress: GameState['progress']): boolean => {
  const tutorial = COMBAT_LOCATION_IDS.find((id) => COMBAT_LOCATIONS[id].completesTutorial)
  return tutorial ? isCombatLocationCompleted(tutorial, progress) : false
}

const unlockRequirement = (condition: CombatLocationDefinition['unlock']): string | null => {
  if (!condition || condition.type === 'always') return null
  if (condition.type === 'boss-kill') return `Defeat ${MONSTERS[condition.bossId]?.name ?? condition.bossId}`
  if (condition.type === 'all-boss-kills') return `Defeat ${condition.bossIds.map((bossId) => MONSTERS[bossId]?.name ?? bossId).join(', ')}`
  if (condition.type === 'chronicle-event') return 'Complete the required Chronicle objective'
  if (condition.type === 'starter-advantage') return `Choose a school with an advantage against ${condition.targetElement}`
  const values = condition.conditions.map(unlockRequirement).filter((value): value is string => Boolean(value))
  if (values.length === 0) return null
  return values.join(condition.type === 'any' ? ' or ' : ' and ')
}
export const getCombatLocationUnlockRequirement = (location: CombatLocationDefinition | null | undefined): string | null => unlockRequirement(location?.unlock)

export const getCombatEncounterMode = (location: CombatLocationDefinition | null | undefined): CombatEncounterMode => location?.encounterMode ?? 'random-pool'
export const usesPowerBasedThreat = (location: CombatLocationDefinition | null | undefined) => Boolean(location?.encounterMode === 'targeted' && (location.type === 'combat-zone' || location.type === 'elite-zone'))
export const isCombatTargetForLocation = (location: CombatLocationDefinition | null | undefined, locationId: CombatLocationId | null | undefined, targetEnemyId: string | null | undefined): targetEnemyId is MonsterId => Boolean(location && locationId && getCombatEncounterMode(location) === 'targeted' && targetEnemyId && location.targetMetadata?.[targetEnemyId as keyof NonNullable<typeof location.targetMetadata>] && location.monsterPool.includes(targetEnemyId as typeof location.monsterPool[number]))
export const hasBossEncounter = (location: CombatLocationRuntimeView): location is BossCombatLocationRuntimeView => location.boss !== null && location.threatRequired !== null
export const chooseCombatLocationMonster = <T extends string>(pool: readonly T[], rng: () => number = () => 0): T => pool[Math.floor(Math.max(0, Math.min(0.999999, rng())) * pool.length)]
