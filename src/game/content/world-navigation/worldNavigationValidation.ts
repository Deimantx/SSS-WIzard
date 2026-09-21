import { DUNGEONS } from '../dungeons/dungeons'
import { MONSTERS, isBossMonster } from '../monsters'
import { COMBAT_CONTINENTS, COMBAT_LOCATIONS, COMBAT_REGIONS } from './worldNavigation'
import type { CombatContinentDefinition, CombatLocationDefinition, CombatRegionDefinition, CombatTargetDifficulty } from './worldNavigationTypes'

export interface CombatWorldNavigationContent {
  continents: Record<string, CombatContinentDefinition>
  regions: Record<string, CombatRegionDefinition>
  locations: Record<string, CombatLocationDefinition>
}

const unique = (values: readonly string[]) => values.filter((value, index) => values.indexOf(value) === index)
const validateOrders = (label: string, entries: readonly { id: string; order: number }[], errors: string[], parentKey?: (entry: { id: string }) => string) => {
  const groups = new Map<string, { id: string; order: number }[]>()
  entries.forEach((entry) => {
    const key = parentKey?.(entry) ?? 'root'
    groups.set(key, [...(groups.get(key) ?? []), entry])
  })
  if (entries.some((entry) => !Number.isInteger(entry.order) || entry.order < 1)) errors.push(`${label}: orders must be positive integers`)
  groups.forEach((group) => {
    const groupOrders = group.map((entry) => entry.order)
    if (unique(groupOrders.map(String)).length !== groupOrders.length) errors.push(`${label}: sibling orders must be unique`)
  })
}

const TARGET_DIFFICULTIES: readonly CombatTargetDifficulty[] = ['easy', 'standard', 'hard', 'apex']

export function validateCombatWorldNavigation(content: CombatWorldNavigationContent = { continents: {}, regions: {}, locations: {} }): string[] {
  const errors: string[] = []
  const continents = Object.values(content.continents)
  const regions = Object.values(content.regions)
  const locations = Object.values(content.locations)

  if (unique(continents.map((entry) => entry.id)).length !== continents.length) errors.push('continents: IDs must be unique')
  if (unique(regions.map((entry) => entry.id)).length !== regions.length) errors.push('regions: IDs must be unique')
  if (unique(locations.map((entry) => entry.id)).length !== locations.length) errors.push('locations: IDs must be unique')
  validateOrders('continents', continents, errors)

  const continentRegionReferences = new Map<string, string[]>()
  continents.forEach((continent) => {
    continent.regionIds.forEach((regionId) => {
      const references = continentRegionReferences.get(regionId) ?? []
      references.push(continent.id)
      continentRegionReferences.set(regionId, references)
      if (!content.regions[regionId]) errors.push(`${continent.id}: references missing region ${regionId}`)
    })
  })
  regions.forEach((region) => {
    if (!content.continents[region.continentId]) errors.push(`${region.id}: references missing continent ${region.continentId}`)
    const parentReferences = continentRegionReferences.get(region.id) ?? []
    if (parentReferences.length !== 1) errors.push(`${region.id}: must be listed by exactly one continent`)
    if (parentReferences[0] && parentReferences[0] !== region.continentId) errors.push(`${region.id}: continent parent does not match its listing continent`)
    if (region.locationIds.length === 0 && !region.prototype) errors.push(`${region.id}: authored region must contain at least one location`)
  })
  validateOrders('regions', regions, errors, (region) => content.regions[region.id]?.continentId ?? '')

  const regionLocationReferences = new Map<string, string[]>()
  regions.forEach((region) => {
    region.locationIds.forEach((locationId) => {
      const references = regionLocationReferences.get(locationId) ?? []
      references.push(region.id)
      regionLocationReferences.set(locationId, references)
      if (!content.locations[locationId]) errors.push(`${region.id}: references missing location ${locationId}`)
    })
  })
  const mappedDungeons = new Map<string, string>()
  locations.forEach((location) => {
    if (!content.regions[location.regionId]) errors.push(`${location.id}: references missing region ${location.regionId}`)
    const parentReferences = regionLocationReferences.get(location.id) ?? []
    if (parentReferences.length !== 1) errors.push(`${location.id}: must be listed by exactly one region`)
    if (parentReferences[0] && parentReferences[0] !== location.regionId) errors.push(`${location.id}: region parent does not match its listing region`)
    if (location.dungeonId) {
      if (!DUNGEONS[location.dungeonId]) errors.push(`${location.id}: references unknown dungeon ${location.dungeonId}`)
      const existingLocation = mappedDungeons.get(location.dungeonId)
      if (existingLocation) errors.push(`${location.id}: dungeon ${location.dungeonId} is already mapped by ${existingLocation}`)
      mappedDungeons.set(location.dungeonId, location.id)
    }
    const encounterMode = location.encounterMode ?? 'random-pool'
    if (encounterMode !== 'random-pool' && encounterMode !== 'targeted') errors.push(`${location.id}: invalid encounter mode ${String(encounterMode)}`)
    if (encounterMode !== 'targeted') return
    const dungeon = location.dungeonId ? DUNGEONS[location.dungeonId] : undefined
    const pool = dungeon?.monsterPool ?? []
    if (pool.length === 0) errors.push(`${location.id}: targeted encounter pool must not be empty`)
    if (!dungeon) return
    if (pool.some((monsterId) => !MONSTERS[monsterId])) errors.push(`${location.id}: targeted pool references an unknown monster`)
    if (pool.includes(dungeon.boss)) errors.push(`${location.id}: targeted pool may not contain its boss`)
    const targetMetadata = location.targetMetadata ?? {}
    pool.forEach((monsterId) => {
      const metadata = targetMetadata[monsterId]
      if (!metadata) {
        errors.push(`${location.id}: targeted pool monster ${monsterId} is missing target metadata`)
        return
      }
      if (!TARGET_DIFFICULTIES.includes(metadata.difficulty)) errors.push(`${location.id}: invalid target difficulty for ${monsterId}`)
      if (!Number.isInteger(metadata.order) || metadata.order < 1) errors.push(`${location.id}: target order for ${monsterId} must be a positive integer`)
    })
    Object.keys(targetMetadata).forEach((monsterId) => { if (!pool.includes(monsterId as typeof pool[number])) errors.push(`${location.id}: target metadata references ${monsterId} outside the normal pool`) })
    const orders = pool.flatMap((monsterId) => targetMetadata[monsterId]?.order ?? [])
    if (new Set(orders).size !== orders.length) errors.push(`${location.id}: target orders must be unique`)
    if (pool.some((monsterId) => MONSTERS[monsterId] && isBossMonster(MONSTERS[monsterId]))) errors.push(`${location.id}: targeted pool may not contain boss monsters`)
  })
  validateOrders('locations', locations, errors, (location) => content.locations[location.id]?.regionId ?? '')

  return errors
}

export const WORLD_NAVIGATION_VALIDATION_ERRORS = validateCombatWorldNavigation({ continents: COMBAT_CONTINENTS, regions: COMBAT_REGIONS, locations: COMBAT_LOCATIONS })
if (WORLD_NAVIGATION_VALIDATION_ERRORS.length > 0 && import.meta.env.DEV) {
  console.error(`[world-navigation] ${WORLD_NAVIGATION_VALIDATION_ERRORS.join('; ')}`)
}
