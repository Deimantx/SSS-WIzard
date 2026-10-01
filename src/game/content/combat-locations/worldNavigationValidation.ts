import { MONSTERS, isBossMonster } from '../monsters'
import { ELITE_ZONE_AFFIXES } from '../elite-affixes'
import { COMBAT_LOCATIONS, COMBAT_REGIONS } from './worldNavigation'
import { isElementId } from '../elements/elements'
import type { CombatLocationDefinition, CombatRegionDefinition, CombatTargetDifficulty } from './worldNavigationTypes'

export interface CombatWorldNavigationContent {
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

export function validateCombatWorldNavigation(content: CombatWorldNavigationContent = { regions: {}, locations: {} }): string[] {
  const errors: string[] = []
  const regions = Object.values(content.regions)
  const locations = Object.values(content.locations)

  if (unique(regions.map((entry) => entry.id)).length !== regions.length) errors.push('regions: IDs must be unique')
  if (unique(locations.map((entry) => entry.id)).length !== locations.length) errors.push('locations: IDs must be unique')
  regions.forEach((region) => {
    if (region.locationIds.length === 0 && !region.prototype) errors.push(`${region.id}: authored region must contain at least one location`)
  })
  validateOrders('regions', regions, errors)

  const regionLocationReferences = new Map<string, string[]>()
  regions.forEach((region) => {
    region.locationIds.forEach((locationId) => {
      const references = regionLocationReferences.get(locationId) ?? []
      references.push(region.id)
      regionLocationReferences.set(locationId, references)
      if (!content.locations[locationId]) errors.push(`${region.id}: references missing location ${locationId}`)
    })
  })
  locations.forEach((location) => {
    if (location.primaryElement !== undefined && !isElementId(location.primaryElement)) errors.push(`${location.id}: references an unknown primary element`)
    if (!content.regions[location.regionId]) errors.push(`${location.id}: references missing region ${location.regionId}`)
    const parentReferences = regionLocationReferences.get(location.id) ?? []
    if (parentReferences.length !== 1) errors.push(`${location.id}: must be listed by exactly one region`)
    if (parentReferences[0] && parentReferences[0] !== location.regionId) errors.push(`${location.id}: region parent does not match its listing region`)
    if (!COMBAT_LOCATIONS[location.id]) errors.push(`${location.id}: references unknown location ${location.id}`)
    const encounterMode = location.encounterMode ?? 'random-pool'
    if (encounterMode !== 'random-pool' && encounterMode !== 'targeted' && encounterMode !== 'sequence') errors.push(`${location.id}: invalid encounter mode ${String(encounterMode)}`)
    if (location.type === 'elite-zone' && encounterMode === 'targeted' && (!location.zoneAffixId || !ELITE_ZONE_AFFIXES[location.zoneAffixId])) errors.push(`${location.id}: targeted elite zone requires one valid Zone Affix`)
    if (location.type !== 'elite-zone' && location.zoneAffixId) errors.push(`${location.id}: Zone Affix is only valid on targeted Elite Zones`)
    if (encounterMode === 'sequence') {
      if (!location.sequence?.length) errors.push(`${location.id}: sequence location requires a non-empty encounter sequence`)
    }
    if (encounterMode !== 'targeted') return
    const pool = location.monsterPool ?? []
    if (pool.length === 0) errors.push(`${location.id}: targeted encounter pool must not be empty`)
    if (pool.some((monsterId) => !MONSTERS[monsterId])) errors.push(`${location.id}: targeted pool references an unknown monster`)
    if (location.bossId && pool.includes(location.bossId)) errors.push(`${location.id}: targeted pool may not contain its boss`)
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

export const WORLD_NAVIGATION_VALIDATION_ERRORS = validateCombatWorldNavigation({ regions: COMBAT_REGIONS, locations: COMBAT_LOCATIONS })
if (WORLD_NAVIGATION_VALIDATION_ERRORS.length > 0 && import.meta.env.DEV) {
  console.error(`[world-navigation] ${WORLD_NAVIGATION_VALIDATION_ERRORS.join('; ')}`)
}
