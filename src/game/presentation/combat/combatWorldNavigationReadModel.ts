import { DUNGEONS, getDungeonUnlockRequirement, isDungeonCompleted, isDungeonUnlocked } from '../../content/dungeons/dungeons'
import { MONSTERS } from '../../content/monsters'
import { COMBAT_CONTINENTS, COMBAT_LOCATIONS, COMBAT_LOCATION_TYPE_METADATA, COMBAT_REGIONS, getCombatEncounterMode, getCombatLocationByDungeonId } from '../../content/world-navigation'
import { getEliteZoneAffix } from '../../content/elite-affixes'
import { buildCombatBossHuntPresentation } from './combatBossHuntPresentation'
import type { CombatNavigationUnlockCondition, CombatContinentId, CombatLocationId, CombatRegionId, CombatTargetDifficulty } from '../../content/world-navigation'
import { isBossCurrentlyActive } from '../../systems/combat/combatBossSelectors'
import { resolveEnemyPowerRating } from './enemyPowerRating'
import type { CombatState, DungeonId, GameState, MonsterId, WorldTierState } from '../../types'
import type { CombatContinentSummaryViewModel, CombatDungeonSequenceStepViewModel, CombatEncounterViewModel, CombatLocationState, CombatLocationViewModel, CombatRegionSummaryViewModel, CombatRegionViewModel, CombatTargetViewModel, CombatWorldNavigationViewModel } from './combatWorldNavigationTypes'

const sorted = <T extends { order: number }>(entries: T[]) => [...entries].sort((left, right) => left.order - right.order)

const isConditionUnlocked = (condition: CombatNavigationUnlockCondition | undefined, progress: Pick<GameState['progress'], 'bossKillsByBoss'>) => {
  if (!condition || condition.type === 'always') return true
  if (condition.type === 'boss-kill') return (progress.bossKillsByBoss[condition.bossId] ?? 0) >= (condition.count ?? 1)
  return condition.bossIds.every((bossId) => (progress.bossKillsByBoss[bossId] ?? 0) >= 1)
}

const getConditionText = (condition: CombatNavigationUnlockCondition | undefined) => {
  if (!condition || condition.type === 'always') return null
  if (condition.type === 'boss-kill') return `Defeat ${MONSTERS[condition.bossId]?.name ?? condition.bossId}`
  const names = condition.bossIds.map((bossId) => MONSTERS[bossId]?.name ?? bossId)
  return `Defeat ${names.slice(0, -1).join(', ')}${names.length > 1 ? `, and ${names[names.length - 1]}` : names[0]}`
}

const isRegionUnlocked = (regionId: CombatRegionId, progress: Pick<GameState['progress'], 'bossKillsByBoss'>) => {
  const region = COMBAT_REGIONS[regionId]
  return Boolean(region && isConditionUnlocked(region.unlock, progress))
}

const isLocationUnlocked = (locationId: CombatLocationId, progress: Pick<GameState['progress'], 'bossKillsByBoss'>) => {
  const location = COMBAT_LOCATIONS[locationId]
  if (!location || !isRegionUnlocked(location.regionId, progress)) return false
  if (!isConditionUnlocked(location.unlock, progress)) return false
  return location.dungeonId ? isDungeonUnlocked(DUNGEONS[location.dungeonId], progress) : !location.prototype
}

const getLocationState = (locationId: CombatLocationId, progress: GameState['progress'], combat: CombatState): CombatLocationState => {
  const location = COMBAT_LOCATIONS[locationId]
  if (!location) return 'prototype'
  if (!isLocationUnlocked(locationId, progress)) return 'locked'
  if (!location.dungeonId || location.prototype) return 'prototype'
  const dungeon = DUNGEONS[location.dungeonId]
  const active = Boolean(combat.active && combat.dungeonId === dungeon.id)
  if (active && combat.threatCleared >= dungeon.threatRequired && !isBossCurrentlyActive({ combat }) && !combat.pendingBossId) return 'boss-ready'
  if (active) return 'active'
  if (isDungeonCompleted(dungeon.id, progress)) return 'completed'
  return 'available'
}

const getStateLabel = (state: CombatLocationState) => state === 'locked' ? 'LOCKED' : state === 'available' ? 'AVAILABLE' : state === 'active' ? 'ACTIVE' : state === 'boss-ready' ? 'BOSS READY' : state === 'completed' ? 'CLEARED' : 'PROTOTYPE'

const buildEncounter = (monsterId: MonsterId, role: 'normal' | 'boss', progress: GameState['progress'], worldTier: GameState['worldTier']['current']): CombatEncounterViewModel => {
  const known = progress.discoveredMonsters.includes(monsterId)
  return { id: monsterId, monsterId, role, name: role === 'boss' || known ? MONSTERS[monsterId].name : 'UNKNOWN CREATURE', known, powerRating: role === 'boss' || known ? resolveEnemyPowerRating(monsterId, worldTier) : null }
}

const buildTarget = (monsterId: MonsterId, difficulty: CombatTargetDifficulty, order: number, progress: GameState['progress'], worldTier: GameState['worldTier']['current']): CombatTargetViewModel => {
  return { monsterId, name: MONSTERS[monsterId]?.name ?? monsterId, known: progress.discoveredMonsters.includes(monsterId), difficulty, order, powerRating: resolveEnemyPowerRating(monsterId, worldTier), worldTier }
}

const buildSequence = (dungeon: typeof DUNGEONS[DungeonId], progress: GameState['progress'], combat: CombatState, worldTier: GameState['worldTier']['current']) => {
  if (!dungeon.encounterSequence) return null
  const encounterIds = [...dungeon.encounterSequence, dungeon.boss]
  const activeIndex = combat.active && combat.dungeonId === dungeon.id && Number.isInteger(combat.dungeonSequenceIndex) && combat.dungeonSequenceIndex! >= 0 && combat.dungeonSequenceIndex! < encounterIds.length ? combat.dungeonSequenceIndex : null
  const steps: CombatDungeonSequenceStepViewModel[] = encounterIds.map((monsterId, index) => {
    const role = index === encounterIds.length - 1 ? 'boss' : 'normal'
    const known = progress.discoveredMonsters.includes(monsterId) || role === 'boss'
    return { order: index + 1, monsterId, name: known ? MONSTERS[monsterId].name : 'UNKNOWN CREATURE', role, known, powerRating: role === 'boss' || known ? resolveEnemyPowerRating(monsterId, worldTier) : null, state: activeIndex === null ? 'upcoming' : index < activeIndex ? 'completed' : index === activeIndex ? 'current' : 'upcoming' }
  })
  return { mode: 'sequence' as const, steps, activeIndex, totalSteps: encounterIds.length }
}

const buildLocation = (locationId: CombatLocationId, progress: GameState['progress'], combat: CombatState, worldTier: WorldTierState = { current: 1, highestUnlocked: 1 }): CombatLocationViewModel => {
  const definition = COMBAT_LOCATIONS[locationId]
  const state = getLocationState(locationId, progress, combat)
  const dungeon = definition?.dungeonId ? DUNGEONS[definition.dungeonId] : null
  const zoneAffix = getEliteZoneAffix(definition?.zoneAffixId)
  const unlockText = state === 'locked' ? (dungeon ? getDungeonUnlockRequirement(dungeon) : null) ?? getConditionText(definition?.unlock) ?? getConditionText(COMBAT_REGIONS[definition?.regionId ?? '']?.unlock) : null
  if (!definition || !dungeon) {
    return {
      id: locationId,
      name: definition?.name ?? 'Unknown Location',
      type: definition?.type ?? 'special-zone',
      typeLabel: COMBAT_LOCATION_TYPE_METADATA[definition?.type ?? 'special-zone'].label,
      state,
      statusLabel: getStateLabel(state),
      unlockText,
      dungeonId: null,
      description: definition?.description ?? 'This location has not been authored yet.',
      encounterMode: getCombatEncounterMode(definition),
      zoneAffix: zoneAffix ? { id: zoneAffix.id, name: zoneAffix.name, description: zoneAffix.description } : null,
      bossHunt: null,
      encounters: [],
      boss: null,
      targeting: null,
      sequence: null,
      firstClearUnlockPreview: definition?.firstClearUnlockPreview ?? [],
      firstClearCompleted: false,
    }
  }
  const encounterMode = getCombatEncounterMode(definition)
  const currentWorldTier = worldTier.current
  const targets = encounterMode === 'targeted'
    ? dungeon.monsterPool.flatMap((monsterId) => {
      const metadata = definition.targetMetadata?.[monsterId]
      return metadata ? [buildTarget(monsterId, metadata.difficulty, metadata.order, progress, currentWorldTier)] : []
    }).sort((left, right) => left.order - right.order)
    : []
  const activeTargetEnemyId = combat.active && combat.dungeonId === dungeon.id && targets.some((target) => target.monsterId === combat.targetEnemyId) ? combat.targetEnemyId : null
  return {
    id: locationId,
    name: definition.name,
    type: definition.type,
    typeLabel: COMBAT_LOCATION_TYPE_METADATA[definition.type].label,
    state,
    statusLabel: getStateLabel(state),
    unlockText,
    dungeonId: dungeon.id,
    description: definition.description ?? dungeon.ui?.description ?? 'A dangerous location beyond the tower gate.',
    encounterMode,
    zoneAffix: zoneAffix ? { id: zoneAffix.id, name: zoneAffix.name, description: zoneAffix.description } : null,
    bossHunt: buildCombatBossHuntPresentation({ combat, progress, dungeon, locationType: definition.type }),
    encounters: dungeon.monsterPool.map((monsterId) => buildEncounter(monsterId, 'normal', progress, currentWorldTier)),
    boss: buildEncounter(dungeon.boss, 'boss', progress, currentWorldTier),
    targeting: encounterMode === 'targeted' ? { mode: 'targeted', targets, activeTargetEnemyId } : null,
    sequence: encounterMode === 'sequence' ? buildSequence(dungeon, progress, combat, currentWorldTier) : null,
    firstClearUnlockPreview: definition.firstClearUnlockPreview ?? [],
    firstClearCompleted: isDungeonCompleted(dungeon.id, progress),
  }
}

const buildContinentSummary = (continentId: CombatContinentId, progress: Pick<GameState['progress'], 'bossKillsByBoss'>): CombatContinentSummaryViewModel => {
  const continent = COMBAT_CONTINENTS[continentId]
  const unlocked = Boolean(continent && isConditionUnlocked(continent.unlock, progress))
  return { id: continentId, name: continent?.name ?? 'Unknown Continent', description: continent?.description ?? '', state: unlocked ? 'available' : 'locked', unlockText: unlocked ? null : getConditionText(continent?.unlock) }
}

const buildRegionSummary = (regionId: CombatRegionId, progress: Pick<GameState['progress'], 'bossKillsByBoss'>): CombatRegionSummaryViewModel => {
  const region = COMBAT_REGIONS[regionId]
  const unlocked = Boolean(region && isRegionUnlocked(regionId, progress))
  return { id: regionId, name: region?.name ?? 'Unknown Region', description: region?.description ?? '', state: unlocked ? 'available' : 'locked', unlockText: unlocked ? null : getConditionText(region?.unlock), locationCount: region?.locationIds.length ?? 0 }
}

const firstUnlockedRegion = (continentId: CombatContinentId, progress: Pick<GameState['progress'], 'bossKillsByBoss'>) => {
  const continent = COMBAT_CONTINENTS[continentId]
  return sorted((continent?.regionIds ?? []).map((regionId) => COMBAT_REGIONS[regionId]).filter((region): region is NonNullable<typeof region> => Boolean(region))).find((region) => isRegionUnlocked(region.id, progress)) ?? null
}

const firstLocationInRegion = (regionId: CombatRegionId, progress: Pick<GameState['progress'], 'bossKillsByBoss'>) => {
  const region = COMBAT_REGIONS[regionId]
  return sorted((region?.locationIds ?? []).map((locationId) => COMBAT_LOCATIONS[locationId]).filter((location): location is NonNullable<typeof location> => Boolean(location))).find((location) => isLocationUnlocked(location.id, progress))?.id ?? region?.locationIds[0] ?? null
}

export const getFirstCombatRegionId = (continentId: CombatContinentId, progress: Pick<GameState['progress'], 'bossKillsByBoss'>) => firstUnlockedRegion(continentId, progress)?.id ?? null
export const getFirstCombatLocationId = (regionId: CombatRegionId, progress: Pick<GameState['progress'], 'bossKillsByBoss'>) => firstLocationInRegion(regionId, progress)

export function getInitialCombatLocationId({ combat, lastEnteredDungeonId, progress }: { combat: Pick<CombatState, 'active' | 'dungeonId'>; lastEnteredDungeonId?: DungeonId; progress: Pick<GameState['progress'], 'bossKillsByBoss'> }): CombatLocationId {
  if (combat.active && combat.dungeonId) return getCombatLocationByDungeonId(combat.dungeonId)?.id ?? 'whispering-woods'
  if (lastEnteredDungeonId && isLocationUnlocked(lastEnteredDungeonId, progress)) return lastEnteredDungeonId
  const firstContinent = sorted(Object.values(COMBAT_CONTINENTS)).find((continent) => isConditionUnlocked(continent.unlock, progress))
  const region = firstContinent ? firstUnlockedRegion(firstContinent.id, progress) : null
  return region ? firstLocationInRegion(region.id, progress) ?? 'whispering-woods' : 'whispering-woods'
}

export function buildCombatWorldNavigationViewModel({ progress, combat, worldTier, selectedContinentId, selectedRegionId, selectedLocationId }: { progress: GameState['progress']; combat: CombatState; worldTier?: WorldTierState; selectedContinentId?: CombatContinentId | null; selectedRegionId?: CombatRegionId | null; selectedLocationId?: CombatLocationId | null }): CombatWorldNavigationViewModel {
  const continents = sorted(Object.values(COMBAT_CONTINENTS)).map((continent) => buildContinentSummary(continent.id, progress))
  const firstContinent = continents.find((continent) => continent.state === 'available') ?? continents[0]
  const continentId = selectedContinentId && continents.some((continent) => continent.id === selectedContinentId && continent.state === 'available') ? selectedContinentId : firstContinent?.id ?? 'continent-1'
  const selectedContinent = continents.find((continent) => continent.id === continentId) ?? buildContinentSummary(continentId, progress)
  const regionCandidates = sorted((COMBAT_CONTINENTS[continentId]?.regionIds ?? []).map((regionId) => COMBAT_REGIONS[regionId]).filter((region): region is NonNullable<typeof region> => Boolean(region)))
  const requestedRegion = selectedRegionId ? regionCandidates.find((region) => region.id === selectedRegionId) : undefined
  const selectedRegionDefinition = requestedRegion && isRegionUnlocked(requestedRegion.id, progress) ? requestedRegion : firstUnlockedRegion(continentId, progress) ?? regionCandidates[0]
  const regions = regionCandidates.map((region) => buildRegionSummary(region.id, progress))
  const selectedRegionSummary = regions.find((region) => region.id === selectedRegionDefinition?.id) ?? buildRegionSummary('first-frontier', progress)
  const regionLocationIds = selectedRegionDefinition?.locationIds ?? []
  const selectedLocationDefinition = selectedLocationId && regionLocationIds.includes(selectedLocationId) ? COMBAT_LOCATIONS[selectedLocationId] : undefined
  const resolvedLocationId = selectedLocationDefinition?.id ?? firstLocationInRegion(selectedRegionSummary.id, progress)
  const selectedLocation = resolvedLocationId ? buildLocation(resolvedLocationId, progress, combat, worldTier) : null
  const locations = sorted(regionLocationIds.map((locationId) => COMBAT_LOCATIONS[locationId]).filter((location): location is NonNullable<typeof location> => Boolean(location))).map((location) => buildLocation(location.id, progress, combat, worldTier))
  const activeLocationId = getCombatLocationByDungeonId(combat.active ? combat.dungeonId : null)?.id ?? null
  const activeLocation = activeLocationId ? buildLocation(activeLocationId, progress, combat, worldTier) : null
  return { continents, regions, selectedContinent, selectedRegion: { ...selectedRegionSummary, locations }, selectedLocation, activeLocationId, activeLocation }
}
