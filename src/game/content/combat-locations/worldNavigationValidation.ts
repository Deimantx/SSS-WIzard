import { MONSTERS, isBossMonster } from '../monsters'
import { ELITE_ZONE_AFFIXES } from '../elite-affixes'
import { COMBAT_LOCATIONS } from './registry'
import { isElementId } from '../elements/elements'
import type { CombatLocationDefinition, CombatTargetDifficulty } from './worldNavigationTypes'

export interface CombatWorldNavigationContent {
  locations: Record<string, CombatLocationDefinition>
}

const unique = (values: readonly string[]) => values.filter((value, index) => values.indexOf(value) === index)
const TARGET_DIFFICULTIES: readonly CombatTargetDifficulty[] = ['easy', 'standard', 'hard', 'apex']

export function validateCombatWorldNavigation(content: CombatWorldNavigationContent = { locations: {} }): string[] {
  const errors: string[] = []
  const locations = Object.values(content.locations)
  if (unique(locations.map((entry) => entry.id)).length !== locations.length) errors.push('locations: IDs must be unique')
  if (unique(locations.map((entry) => String(entry.progressionOrder))).length !== locations.length) errors.push('locations: progression orders must be unique')
  locations.forEach((location) => {
    if (location.primaryElement !== undefined && !isElementId(location.primaryElement)) errors.push(`${location.id}: references an unknown primary element`)
    if (!COMBAT_LOCATIONS[location.id]) errors.push(`${location.id}: references unknown location ${location.id}`)
    if (!Number.isInteger(location.progressionOrder) || location.progressionOrder < 1) errors.push(`${location.id}: progressionOrder must be a positive integer`)
    const encounterMode = location.encounterMode ?? 'random-pool'
    if (encounterMode !== 'random-pool' && encounterMode !== 'targeted' && encounterMode !== 'sequence') errors.push(`${location.id}: invalid encounter mode ${String(encounterMode)}`)
    if (location.type === 'elite-zone' && encounterMode === 'targeted' && (!location.zoneAffixId || !ELITE_ZONE_AFFIXES[location.zoneAffixId])) errors.push(`${location.id}: targeted elite zone requires one valid Zone Affix`)
    if (location.type !== 'elite-zone' && location.zoneAffixId) errors.push(`${location.id}: Zone Affix is only valid on targeted Elite Zones`)
    if (encounterMode === 'sequence' && !location.sequence?.length) errors.push(`${location.id}: sequence location requires a non-empty encounter sequence`)
    if (location.sequenceBossIds?.length) {
      if (encounterMode !== 'sequence') errors.push(`${location.id}: sequence bosses require a sequence encounter`)
      location.sequenceBossIds.forEach((bossId) => {
        if (!location.sequence?.includes(bossId)) errors.push(`${location.id}: sequence boss ${bossId} is missing from the sequence`)
        if (!MONSTERS[bossId] || !isBossMonster(MONSTERS[bossId])) errors.push(`${location.id}: sequence boss ${bossId} must reference a boss monster`)
      })
    }
    if (encounterMode !== 'targeted') return
    const pool = location.monsterPool ?? []
    if (pool.length === 0) errors.push(`${location.id}: targeted encounter pool must not be empty`)
    if (pool.some((monsterId) => !MONSTERS[monsterId])) errors.push(`${location.id}: targeted pool references an unknown monster`)
    if (location.bossId && pool.includes(location.bossId)) errors.push(`${location.id}: targeted pool may not contain its boss`)
    const targetMetadata = location.targetMetadata ?? {}
    pool.forEach((monsterId) => {
      const metadata = targetMetadata[monsterId]
      if (!metadata) { errors.push(`${location.id}: targeted pool monster ${monsterId} is missing target metadata`); return }
      if (!TARGET_DIFFICULTIES.includes(metadata.difficulty)) errors.push(`${location.id}: invalid target difficulty for ${monsterId}`)
      if (!Number.isInteger(metadata.order) || metadata.order < 1) errors.push(`${location.id}: target order for ${monsterId} must be a positive integer`)
    })
    Object.keys(targetMetadata).forEach((monsterId) => { if (!pool.includes(monsterId as typeof pool[number])) errors.push(`${location.id}: target metadata references ${monsterId} outside the normal pool`) })
    const orders = pool.flatMap((monsterId) => targetMetadata[monsterId]?.order ?? [])
    if (new Set(orders).size !== orders.length) errors.push(`${location.id}: target orders must be unique`)
    if (pool.some((monsterId) => MONSTERS[monsterId] && isBossMonster(MONSTERS[monsterId]))) errors.push(`${location.id}: targeted pool may not contain boss monsters`)
  })
  return errors
}

export const WORLD_NAVIGATION_VALIDATION_ERRORS = validateCombatWorldNavigation({ locations: COMBAT_LOCATIONS })
if (WORLD_NAVIGATION_VALIDATION_ERRORS.length > 0 && import.meta.env.DEV) console.error(`[world-navigation] ${WORLD_NAVIGATION_VALIDATION_ERRORS.join('; ')}`)
