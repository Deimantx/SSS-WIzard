import type { DungeonStatisticsSession } from './dungeonStatisticsTypes'

export const sessionHours = (session: DungeonStatisticsSession | null) => session ? session.elapsedMs / 3_600_000 : 0
export const ratePerHour = (value: number, session: DungeonStatisticsSession | null) => {
  const hours = sessionHours(session)
  return hours >= 1 / 3_600 ? Math.max(0, value) / hours : 0
}
export const runsPerHour = (session: DungeonStatisticsSession | null) => session && session.completedRuns > 0 ? ratePerHour(session.completedRuns, session) : null
export const averageRunMs = (session: DungeonStatisticsSession | null) => session && session.completedRuns > 0 ? session.completedRunDurationTotalMs / session.completedRuns : null
export const averageEncounterMs = (session: DungeonStatisticsSession | null) => session && session.normalEncounterCount > 0 ? session.normalEncounterDurationTotalMs / session.normalEncounterCount : null
export const averageBossMs = (session: DungeonStatisticsSession | null) => session && session.bossEncounterCount > 0 ? session.bossDurationTotalMs / session.bossEncounterCount : null
