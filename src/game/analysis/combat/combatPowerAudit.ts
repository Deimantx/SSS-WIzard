import { COMBAT_LOCATIONS, getCombatEncounterMode, hasBossEncounter, type CombatLocationId, type CombatLocationType, type CombatTargetDifficulty } from '../../content/combat-locations'
import { MONSTERS } from '../../content/monsters'
import { resolveEnemyPowerRating } from '../../presentation/combat/enemyPowerRating'
import { resolveBossThreatRequirement } from '../../systems/combat/combatThreat'
import type { MonsterId, WorldTierId } from '../../types'

export interface MonsterPowerAuditRow {
  locationType: CombatLocationType
  location: string
  locationId: CombatLocationId
  encounterMode: ReturnType<typeof getCombatEncounterMode>
  monsterId: MonsterId
  role: 'normal' | 'boss'
  difficulty: CombatTargetDifficulty | null
  order: number
  worldTier: WorldTierId
  power: number
}

export interface SequencePowerAuditRow extends MonsterPowerAuditRow {
  step: number
  deltaFromPrevious: number | null
  negativeDeltaPercent: number | null
  largeNegativeDelta: boolean
}

export interface BossPowerRatioAuditRow {
  locationId: CombatLocationId
  dungeon: string
  lastNormalPower: number
  bossPower: number
  bossToLastNormalRatio: number
  carriesResources: true
  normalStepCount: number
}

export interface DifficultyInversionAudit {
  locationId: CombatLocationId
  location: string
  lowerDifficulty: CombatTargetDifficulty
  lowerTargetId: MonsterId
  lowerPower: number
  higherDifficulty: CombatTargetDifficulty
  higherTargetId: MonsterId
  higherPower: number
}

export interface ThreatKillsToBossAuditRow {
  locationType: CombatLocationType
  location: string
  locationId: CombatLocationId
  worldTier: WorldTierId
  threatRequired: number
  weakestThreatPerKill: number
  medianThreatPerKill: number
  strongestThreatPerKill: number
  killsUsingWeakest: number
  killsUsingMedian: number
  killsUsingStrongest: number
  worldTierDriftPercent: number
  warnings: string[]
}

const DIFFICULTY_RANK: Record<CombatTargetDifficulty, number> = { easy: 0, standard: 1, hard: 2, apex: 3 }
const WORLD_TIERS: readonly WorldTierId[] = [1, 2, 3, 4, 5]

const locationRows = (locationId: CombatLocationId, worldTier: WorldTierId): MonsterPowerAuditRow[] => {
  const location = COMBAT_LOCATIONS[locationId]
  if (!location?.id) return []
  const dungeon = COMBAT_LOCATIONS[location.id]
  if (!dungeon) return []
  const mode = getCombatEncounterMode(location)
  const rows: MonsterPowerAuditRow[] = []
  const add = (monsterId: MonsterId, role: 'normal' | 'boss', order: number, difficulty: CombatTargetDifficulty | null) => {
    if (!MONSTERS[monsterId]) return
    rows.push({ locationType: location.type, location: location.name, locationId, encounterMode: mode, monsterId, role, difficulty, order, worldTier, power: resolveEnemyPowerRating(monsterId, worldTier) })
  }

  const normalIds = mode === 'targeted' && location.targetMetadata
    ? Object.entries(location.targetMetadata).sort(([, left], [, right]) => (left?.order ?? Number.MAX_SAFE_INTEGER) - (right?.order ?? Number.MAX_SAFE_INTEGER)).map(([monsterId]) => monsterId as MonsterId)
    : mode === 'sequence' && dungeon.encounterSequence
      ? dungeon.encounterSequence
      : dungeon.monsterPool
  normalIds.forEach((monsterId, index) => add(monsterId, 'normal', mode === 'targeted' ? location.targetMetadata?.[monsterId]?.order ?? index + 1 : index + 1, mode === 'targeted' ? location.targetMetadata?.[monsterId]?.difficulty ?? null : null))
  if (hasBossEncounter(dungeon)) add(dungeon.boss, 'boss', normalIds.length + 1, null)
  return rows
}

/** Development/test-only view of authored baseline Power across the current journey. */
export const buildMonsterPowerAudit = (worldTier: WorldTierId = 1): MonsterPowerAuditRow[] => Object.keys(COMBAT_LOCATIONS).flatMap((locationId) => locationRows(locationId as CombatLocationId, worldTier))

export const buildSequencePowerAudit = (worldTier: WorldTierId = 1): SequencePowerAuditRow[] => buildMonsterPowerAudit(worldTier)
  .filter((row) => row.encounterMode === 'sequence')
  .sort((left, right) => left.locationId.localeCompare(right.locationId) || left.order - right.order)
  .map((row, index, rows) => {
    const previous = index > 0 && rows[index - 1].locationId === row.locationId ? rows[index - 1] : null
    const deltaFromPrevious = previous ? row.power - previous.power : null
    const negativeDeltaPercent = previous && deltaFromPrevious !== null && deltaFromPrevious < 0 ? Math.abs(deltaFromPrevious) / Math.max(1, previous.power) * 100 : null
    return { ...row, step: row.order, deltaFromPrevious, negativeDeltaPercent, largeNegativeDelta: negativeDeltaPercent !== null && negativeDeltaPercent > 15 }
  })

export const buildBossPowerRatioAudit = (worldTier: WorldTierId = 1): BossPowerRatioAuditRow[] => {
  const sequenceRows = buildSequencePowerAudit(worldTier)
  return [...new Set(sequenceRows.map((row) => row.locationId))].flatMap((locationId) => {
    const location = COMBAT_LOCATIONS[locationId]
    const resolvedLocationId = location?.id
    const dungeon = resolvedLocationId ? COMBAT_LOCATIONS[resolvedLocationId] : null
    const rows = sequenceRows.filter((row) => row.locationId === locationId)
    const normalRows = rows.filter((row) => row.role === 'normal')
    const lastNormal = normalRows[normalRows.length - 1]
    const boss = rows.find((row) => row.role === 'boss')
    if (!dungeon || !lastNormal || !boss) return []
    return [{ locationId: dungeon.id, dungeon: dungeon.name, lastNormalPower: lastNormal.power, bossPower: boss.power, bossToLastNormalRatio: boss.power / Math.max(1, lastNormal.power), carriesResources: true as const, normalStepCount: rows.filter((row) => row.role === 'normal').length }]
  })
}

export const buildDifficultyInversionAudit = (worldTier: WorldTierId = 1): DifficultyInversionAudit[] => {
  const inversions: DifficultyInversionAudit[] = []
  buildMonsterPowerAudit(worldTier).filter((row) => row.encounterMode === 'targeted' && row.role === 'normal' && row.difficulty).forEach((left, index, rows) => {
    rows.slice(index + 1).forEach((right) => {
      if (right.locationId !== left.locationId || !left.difficulty || !right.difficulty || DIFFICULTY_RANK[left.difficulty] >= DIFFICULTY_RANK[right.difficulty] || left.power <= right.power) return
      inversions.push({ locationId: left.locationId, location: left.location, lowerDifficulty: left.difficulty, lowerTargetId: left.monsterId, lowerPower: left.power, higherDifficulty: right.difficulty, higherTargetId: right.monsterId, higherPower: right.power })
    })
  })
  return inversions
}

export const getPowerAuditWorldTiers = () => WORLD_TIERS

/** Power-based boss pacing from authored target order and the canonical threat functions. */
export const buildThreatKillsToBossAudit = (): ThreatKillsToBossAuditRow[] => {
  const baseline = new Map<CombatLocationId, number>()
  const rows: ThreatKillsToBossAuditRow[] = []
  Object.values(COMBAT_LOCATIONS).filter((location) => location.id && getCombatEncounterMode(location) === 'targeted' && hasBossEncounter(COMBAT_LOCATIONS[location.id])).forEach((location) => {
    const locationId = location.id!
    const targets = Object.entries(location.targetMetadata ?? {})
      .sort(([, left], [, right]) => (left?.order ?? Number.MAX_SAFE_INTEGER) - (right?.order ?? Number.MAX_SAFE_INTEGER))
      .map(([monsterId]) => monsterId as MonsterId)
    if (!targets.length) return
    WORLD_TIERS.forEach((worldTier) => {
      const gains = targets.map((monsterId) => resolveEnemyPowerRating(monsterId, worldTier)).sort((left, right) => left - right)
      const requirement = resolveBossThreatRequirement(locationId, worldTier)
      const weakest = gains[0]
      const strongest = gains[gains.length - 1]
      const median = gains[Math.floor(gains.length / 2)]
      const killsUsingWeakest = Math.ceil(requirement / weakest)
      const killsUsingMedian = Math.ceil(requirement / median)
      const killsUsingStrongest = Math.ceil(requirement / strongest)
      const wt1Median = baseline.get(location.id) ?? (worldTier === 1 ? killsUsingMedian : 0)
      if (worldTier === 1) baseline.set(location.id, killsUsingMedian)
      const worldTierDriftPercent = wt1Median > 0 ? Math.abs(killsUsingMedian - wt1Median) / wt1Median * 100 : 0
      const warnings: string[] = []
      if (killsUsingStrongest === 1) warnings.push('Strongest normal target unlocks the boss in one kill')
      if (worldTier >= 3 && killsUsingMedian > 12) warnings.push('Median target requires more than 12 kills per boss attempt')
      if (worldTier > 1 && worldTierDriftPercent > 25) warnings.push(`WT pacing drifts ${worldTierDriftPercent.toFixed(1)}% from WT1`)
      rows.push({ locationType: location.type, location: location.name, locationId: location.id, worldTier, threatRequired: requirement, weakestThreatPerKill: weakest, medianThreatPerKill: median, strongestThreatPerKill: strongest, killsUsingWeakest, killsUsingMedian, killsUsingStrongest, worldTierDriftPercent, warnings })
    })
  })
  return rows
}
