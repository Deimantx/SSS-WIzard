import { MONSTERS } from '../../content/monsters'
import { COMBAT_LOCATIONS, COMBAT_LOCATION_TYPE_METADATA, getCombatEncounterMode, getCombatLocationById, getCombatLocationUnlockRequirement, hasBossEncounter, isCombatLocationCompleted, isCombatLocationUnlocked, isCombatNavigationConditionUnlocked } from '../../content/combat-locations'
import { getEliteZoneAffix } from '../../content/elite-affixes'
import { buildCombatBossHuntPresentation } from './combatBossHuntPresentation'
import type { CombatNavigationUnlockCondition, CombatLocationDefinition, CombatLocationId, CombatTargetDifficulty, CombatZoneType } from '../../content/combat-locations'
import { isBossCurrentlyActive } from '../../systems/combat/combatBossSelectors'
import { resolveEnemyPowerRating } from './enemyPowerRating'
import { resolveBossThreatRequirement } from '../../systems/combat/combatThreat'
import type { CombatState, GameState, MonsterId, WorldTierState } from '../../types'
import type { CombatDungeonSequenceStepViewModel, CombatEncounterViewModel, CombatLocationState, CombatLocationViewModel, CombatTargetViewModel, CombatWorldNavigationViewModel } from './combatWorldNavigationTypes'

const sorted = <T extends { order: number }>(entries: T[]) => [...entries].sort((left, right) => left.order - right.order)

type NavigationProgress = Pick<GameState['progress'], 'bossKillsByBoss'> & Partial<Pick<GameState['progress'], 'startingSchoolId' | 'chronicle'>>
const isConditionUnlocked = (condition: CombatNavigationUnlockCondition | undefined, progress: NavigationProgress) => isCombatNavigationConditionUnlocked(condition, progress)

const getConditionText = (condition: CombatNavigationUnlockCondition | undefined): string | null => {
  if (!condition || condition.type === 'always') return null
  if (condition.type === 'boss-kill') return `Defeat ${MONSTERS[condition.bossId]?.name ?? condition.bossId}`
  if (condition.type === 'chronicle-event') return condition.eventId === 'elemental-tutorial-zones-opened' ? 'Defeat an enemy in your counter zone' : condition.eventId === 'first-elemental-tutorial-boss-defeated' ? 'Defeat any elemental tutorial boss' : 'Complete the related Chronicle step'
  if (condition.type === 'starter-advantage') return `Strong with your starting school or complete the Elemental Frontier`
  if (condition.type === 'any') return condition.conditions.map(getConditionText).filter(Boolean).join(' or ')
  if (condition.type === 'all') return condition.conditions.map(getConditionText).filter(Boolean).join(' and ')
  const names = condition.bossIds.map((bossId) => MONSTERS[bossId]?.name ?? bossId)
  return `Defeat ${names.slice(0, -1).join(', ')}${names.length > 1 ? `, and ${names[names.length - 1]}` : names[0]}`
}

const isLocationUnlocked = (locationId: CombatLocationId, progress: NavigationProgress) => isCombatLocationUnlocked(locationId, progress)

const getLocationState = (locationId: CombatLocationId, progress: GameState['progress'], combat: CombatState, worldTier: GameState['worldTier']['current'] = 1): CombatLocationState => {
  const location = COMBAT_LOCATIONS[locationId]
  if (!location) return 'prototype'
  if (!isLocationUnlocked(locationId, progress)) return 'locked'
  if (!location.id || location.prototype) return 'prototype'
  const dungeon = COMBAT_LOCATIONS[location.id]
  const active = Boolean(combat.active && combat.locationId === dungeon.id)
  const encounterMode = getCombatEncounterMode(location)
  if (encounterMode === 'targeted' && hasBossEncounter(dungeon) && active && combat.threatCleared >= resolveBossThreatRequirement(dungeon.id, worldTier) && !isBossCurrentlyActive({ combat }) && !combat.pendingBossId) return 'boss-ready'
  if (active) return 'active'
  if (isCombatLocationCompleted(dungeon.id, progress)) return 'completed'
  return 'available'
}

const getStateLabel = (state: CombatLocationState) => state === 'locked' ? 'LOCKED' : state === 'available' ? 'AVAILABLE' : state === 'active' ? 'ACTIVE' : state === 'boss-ready' ? 'BOSS READY' : state === 'completed' ? 'CLEARED' : 'PROTOTYPE'

const buildEncounter = (monsterId: MonsterId, role: 'normal' | 'boss', progress: GameState['progress'], worldTier: GameState['worldTier']['current']): CombatEncounterViewModel => {
  const known = progress.discoveredMonsters.includes(monsterId)
  return { id: monsterId, monsterId, role, name: MONSTERS[monsterId].name, known, powerRating: resolveEnemyPowerRating(monsterId, worldTier) }
}

const buildTarget = (monsterId: MonsterId, difficulty: CombatTargetDifficulty, order: number, progress: GameState['progress'], worldTier: GameState['worldTier']['current']): CombatTargetViewModel => {
  return { monsterId, name: MONSTERS[monsterId]?.name ?? monsterId, known: progress.discoveredMonsters.includes(monsterId), difficulty, order, powerRating: resolveEnemyPowerRating(monsterId, worldTier), worldTier }
}

const buildSequence = (dungeon: typeof COMBAT_LOCATIONS[CombatLocationId], progress: GameState['progress'], combat: CombatState, worldTier: GameState['worldTier']['current']) => {
  if (!dungeon.encounterSequence || !hasBossEncounter(dungeon)) return null
  const encounterIds = [...dungeon.encounterSequence, dungeon.boss]
  const activeIndex = combat.active && combat.locationId === dungeon.id && Number.isInteger(combat.sequenceIndex) && combat.sequenceIndex! >= 0 && combat.sequenceIndex! < encounterIds.length ? combat.sequenceIndex : null
  const steps: CombatDungeonSequenceStepViewModel[] = encounterIds.map((monsterId, index) => {
    const role = index === encounterIds.length - 1 ? 'boss' : 'normal'
    const known = progress.discoveredMonsters.includes(monsterId)
    return { order: index + 1, monsterId, name: MONSTERS[monsterId].name, role, known, powerRating: resolveEnemyPowerRating(monsterId, worldTier), state: activeIndex === null ? 'upcoming' : index < activeIndex ? 'completed' : index === activeIndex ? 'current' : 'upcoming' }
  })
  return { mode: 'sequence' as const, steps, activeIndex, totalSteps: encounterIds.length }
}

const buildLocation = (locationId: CombatLocationId, progress: GameState['progress'], combat: CombatState, worldTier: WorldTierState = { current: 1, highestUnlocked: 1 }): CombatLocationViewModel => {
  const definition = COMBAT_LOCATIONS[locationId]
  const state = getLocationState(locationId, progress, combat, worldTier.current)
  const dungeon = definition?.id ? COMBAT_LOCATIONS[definition.id] : null
  const zoneAffix = getEliteZoneAffix(definition?.zoneAffixId)
  const unlockText = state === 'locked' ? (dungeon ? getCombatLocationUnlockRequirement(dungeon) : null) ?? getConditionText(definition?.unlock) : null
  if (!definition || !dungeon) {
    return {
      id: locationId,
      name: definition?.name ?? 'Unknown Location',
      type: definition?.type ?? 'combat-zone',
      primaryElement: definition?.primaryElement ?? null,
      elementsPresent: definition?.elementsPresent ?? [],
      typeLabel: COMBAT_LOCATION_TYPE_METADATA[definition?.type ?? 'combat-zone'].label,
      state,
      statusLabel: getStateLabel(state),
      unlockText,
      locationId: null,
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
  const contentVisible = state !== 'locked' && state !== 'prototype'
  const targets = encounterMode === 'targeted'
    && contentVisible
    ? dungeon.monsterPool.flatMap((monsterId) => {
      const metadata = definition.targetMetadata?.[monsterId]
      return metadata ? [buildTarget(monsterId, metadata.difficulty, metadata.order, progress, currentWorldTier)] : []
    }).sort((left, right) => left.order - right.order)
    : []
  const activeTargetEnemyId = combat.active && combat.locationId === dungeon.id && targets.some((target) => target.monsterId === combat.targetEnemyId) ? combat.targetEnemyId : null
  return {
    id: locationId,
    name: definition.name,
    type: definition.type,
    primaryElement: definition.primaryElement ?? null,
    elementsPresent: definition.elementsPresent ?? [],
    typeLabel: COMBAT_LOCATION_TYPE_METADATA[definition.type].label,
    state,
    statusLabel: getStateLabel(state),
    unlockText,
    locationId: dungeon.id,
    description: definition.description ?? dungeon.ui?.description ?? 'A dangerous location beyond the tower gate.',
    encounterMode,
    zoneAffix: zoneAffix ? { id: zoneAffix.id, name: zoneAffix.name, description: zoneAffix.description } : null,
    bossHunt: contentVisible && hasBossEncounter(dungeon) && encounterMode === 'targeted' ? buildCombatBossHuntPresentation({ combat, progress, dungeon, locationType: definition.type, worldTier: currentWorldTier }) : null,
    encounters: contentVisible ? dungeon.monsterPool.map((monsterId) => buildEncounter(monsterId, 'normal', progress, currentWorldTier)) : [],
    boss: contentVisible && hasBossEncounter(dungeon) ? buildEncounter(dungeon.boss, 'boss', progress, currentWorldTier) : null,
    targeting: contentVisible && encounterMode === 'targeted' ? { mode: 'targeted', targets, activeTargetEnemyId } : null,
    sequence: contentVisible && encounterMode === 'sequence' ? buildSequence(dungeon, progress, combat, currentWorldTier) : null,
    firstClearUnlockPreview: definition.firstClearUnlockPreview ?? [],
    firstClearCompleted: isCombatLocationCompleted(dungeon.id, progress),
  }
}

export function getInitialCombatLocationId({ combat, lastEnteredCombatLocationId, progress }: { combat: Pick<CombatState, 'active' | 'locationId'>; lastEnteredCombatLocationId?: CombatLocationId; progress: NavigationProgress }): CombatLocationId {
  if (combat.active && combat.locationId) return getCombatLocationById(combat.locationId)?.id ?? 'whispering-woods'
  const lastEnteredLocation = lastEnteredCombatLocationId ? getCombatLocationById(lastEnteredCombatLocationId) : null
  if (lastEnteredLocation && isLocationUnlocked(lastEnteredLocation.id, progress)) return lastEnteredLocation.id
  const firstUnlocked = Object.values(COMBAT_LOCATIONS).sort(locationOrder).find((location) => isLocationUnlocked(location.id, progress))
  return firstUnlocked?.id ?? 'stonewake-hollow'
}

const locationOrder = (left: CombatLocationDefinition, right: CombatLocationDefinition) => left.progressionOrder - right.progressionOrder

export function buildCombatWorldNavigationViewModel({ progress, combat, worldTier, selectedLocationId, selectedType }: { progress: GameState['progress']; combat: CombatState; worldTier?: WorldTierState; selectedLocationId?: CombatLocationId | null; selectedType?: CombatZoneType }): CombatWorldNavigationViewModel {
  const allLocations = Object.values(COMBAT_LOCATIONS).sort(locationOrder).map((location) => buildLocation(location.id, progress, combat, worldTier))
  const selectedLocationCandidate = selectedLocationId ? allLocations.find((location) => location.id === selectedLocationId) : undefined
  const validTypes: CombatZoneType[] = ['combat-zone', 'elite-zone', 'hunting-ground', 'dungeon']
  const resolvedType = selectedType ?? (selectedLocationCandidate && validTypes.includes(selectedLocationCandidate.type as CombatZoneType) ? selectedLocationCandidate.type as CombatZoneType : 'combat-zone')
  const typeLocations = allLocations.filter((location) => location.type === resolvedType)
  const resolvedLocationId = selectedLocationCandidate?.type === resolvedType
    ? selectedLocationCandidate.id
    : typeLocations.find((location) => location.state !== 'locked' && location.state !== 'prototype')?.id ?? typeLocations[0]?.id
  const selectedLocation = resolvedLocationId ? allLocations.find((location) => location.id === resolvedLocationId) ?? null : null
  const activeLocationId = getCombatLocationById(combat.active ? combat.locationId : null)?.id ?? null
  const activeLocation = activeLocationId ? buildLocation(activeLocationId, progress, combat, worldTier) : null
  return { allLocations, selectedType: resolvedType, selectedLocation, activeLocationId, activeLocation }
}
