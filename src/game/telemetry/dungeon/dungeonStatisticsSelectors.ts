import type { DungeonStatisticsSession } from './dungeonStatisticsTypes'

type SessionElapsed = Pick<DungeonStatisticsSession, 'elapsedMs'>
type SessionRuns = Pick<DungeonStatisticsSession, 'elapsedMs' | 'completedRuns'>

export const sessionElapsedMs = (session: SessionElapsed | null) => session && Number.isFinite(session.elapsedMs) ? Math.max(0, session.elapsedMs) : 0
export const sessionHours = (session: SessionElapsed | null) => sessionElapsedMs(session) / 3_600_000
export const ratePerHour = (value: number, session: SessionElapsed | null) => {
  const elapsedMs = sessionElapsedMs(session)
  if (elapsedMs <= 0 || !Number.isFinite(value)) return 0
  return Math.max(0, value) * 3_600_000 / elapsedMs
}
export const totalLootQuantity = (session: Pick<DungeonStatisticsSession, 'lootByItemId'> | null) => session ? Object.values(session.lootByItemId).reduce((total, quantity) => total + (Number.isFinite(quantity) ? Math.max(0, quantity ?? 0) : 0), 0) : 0
export const runsPerHour = (session: SessionRuns | null) => session && session.completedRuns > 0 ? ratePerHour(session.completedRuns, session) : null
export const averageRunMs = (session: DungeonStatisticsSession | null) => session && session.completedRuns > 0 ? session.completedRunDurationTotalMs / session.completedRuns : null
export const averageEncounterMs = (session: DungeonStatisticsSession | null) => session && session.normalEncounterCount > 0 ? session.normalEncounterDurationTotalMs / session.normalEncounterCount : null
export const averageBossMs = (session: DungeonStatisticsSession | null) => session && session.bossEncounterCount > 0 ? session.bossDurationTotalMs / session.bossEncounterCount : null
