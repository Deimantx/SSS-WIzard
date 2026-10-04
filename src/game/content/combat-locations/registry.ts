import { MONSTERS } from '../monsters'
import { ELEMENT_IDS } from '../elements/elements'
import { getMonsterPrimaryAffinity } from '../monsters/monsterTypes'
import { COMBAT_LOCATION_IDS, type CombatLocationId } from './combatLocationIds'
import type { CombatLocationDefinition, CombatLocationRuntimeView } from './worldNavigationTypes'
import { getCombatProgressionMetadata } from './combatProgression'
import { COMBAT_ROSTER_MOVE_TO, COMBAT_SEQUENCE_BOSSES } from './rosterReassignments'
import { combatZoneLocations } from './combat-zones/locations'
import { eliteZoneLocations } from './elite-zones/locations'
import { huntingGroundLocations } from './hunting-grounds/locations'
import { dungeonLocations } from './dungeons/locations'
import { expansionCombatZoneLocations } from './combat-zones/expansionLocations'
import { expansionEliteZoneLocations } from './elite-zones/expansionLocations'
import { expansionHuntingGroundLocations } from './hunting-grounds/expansionLocations'
import { expansionDungeonLocations } from './dungeons/expansionLocations'

const authoredLocationDefinitions = {
  ...combatZoneLocations,
  ...eliteZoneLocations,
  ...huntingGroundLocations,
  ...dungeonLocations,
  ...expansionCombatZoneLocations,
  ...expansionEliteZoneLocations,
  ...expansionHuntingGroundLocations,
  ...expansionDungeonLocations,
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>

const authoredLocations = (() => {
  const locations = Object.fromEntries(Object.entries(authoredLocationDefinitions).map(([id, location]) => [id, { ...location, monsterPool: [...location.monsterPool], ...(location.sequence ? { sequence: [...location.sequence] } : {}) }])) as unknown as Record<CombatLocationId, CombatLocationDefinition>
  Object.entries(COMBAT_ROSTER_MOVE_TO).forEach(([monsterId, targetId]) => {
    if (!targetId) return
    const sourceId = COMBAT_LOCATION_IDS.find((id) => locations[id].monsterPool.includes(monsterId as never))
    if (!sourceId) throw new Error(`Combat roster move source missing for ${monsterId}`)
    if (sourceId === targetId) throw new Error(`Combat roster move is redundant for ${monsterId}`)
    const source = locations[sourceId]
    const target = locations[targetId]
    source.monsterPool = source.monsterPool.filter((id) => id !== monsterId)
    if (target.monsterPool.includes(monsterId as never)) throw new Error(`Duplicate Combat roster member: ${monsterId}`)
    target.monsterPool = [...target.monsterPool, monsterId as never]
  })
  Object.entries(COMBAT_SEQUENCE_BOSSES).forEach(([locationId, bossIds]) => {
    const location = locations[locationId as CombatLocationId]
    if (!location || !location.sequence) throw new Error(`Sequence boss destination is not a dungeon: ${locationId}`)
    location.sequenceBossIds = [...bossIds]
    location.sequence = [...location.sequence, ...bossIds]
  })
  Object.values(locations).forEach((location) => {
    const progression = getCombatProgressionMetadata(location)
    location.progression = progression
    if (progression.locationType === 'combat-zone') location.primaryElement = progression.element as CombatLocationDefinition['primaryElement']
    // The primary dungeon clear replaces legacy branching boss prerequisites
    // for all core zones in that tier; authored dungeon prerequisites remain.
    if (progression.locationType === 'combat-zone' && progression.tier > 1) location.unlock = { type: 'always' }
    // Hunting access is intentionally the intersection of its tier gate and
    // Hunter standing, independent of legacy branch boss requirements.
    if (progression.locationType === 'hunting-ground') location.unlock = { type: 'always' }
    if (!location.targetMetadata) return
    location.targetMetadata = Object.fromEntries(location.monsterPool.map((monsterId, index) => [monsterId, {
      difficulty: location.targetMetadata?.[monsterId]?.difficulty ?? 'standard',
      order: index + 1,
    }]))
  })
  return locations
})()

const missingAuthoredLocations = COMBAT_LOCATION_IDS.filter((id) => !authoredLocations[id])
if (missingAuthoredLocations.length) throw new Error(`Missing canonical Combat Location: ${missingAuthoredLocations.join(', ')}`)
export const COMBAT_LOCATION_ORDER: readonly CombatLocationId[] = [...COMBAT_LOCATION_IDS].sort((left, right) => authoredLocations[left]!.progressionOrder - authoredLocations[right]!.progressionOrder)

const toRuntimeView = (location: CombatLocationDefinition): CombatLocationRuntimeView => {
  const roster = [...location.monsterPool, ...(location.bossId ? [location.bossId] : [])]
  const elementsPresent = ELEMENT_IDS.filter((element) => roster.some((monsterId) => {
    const monster = MONSTERS[monsterId]
    return monster && getMonsterPrimaryAffinity(monster) === element
  }))
  return {
    ...location,
    progression: getCombatProgressionMetadata(location),
    boss: location.bossId,
    ...(location.sequence ? { encounterSequence: location.sequence } : {}),
    ...(location.description ? { ui: { description: location.description } } : {}),
    elementsPresent,
  }
}

export const COMBAT_LOCATIONS = Object.fromEntries(COMBAT_LOCATION_ORDER.map((id) => {
  const location = authoredLocations[id]
  if (!location) throw new Error(`Missing canonical Combat Location: ${id}`)
  return [id, toRuntimeView(location)]
})) as Record<CombatLocationId, CombatLocationRuntimeView>

export const getCombatLocationElements = (location: CombatLocationDefinition): readonly (typeof ELEMENT_IDS)[number][] => {
  const roster = [...location.monsterPool, ...(location.bossId ? [location.bossId] : [])]
  return ELEMENT_IDS.filter((element) => roster.some((monsterId) => {
    const monster = MONSTERS[monsterId]
    return monster && getMonsterPrimaryAffinity(monster) === element
  }))
}
