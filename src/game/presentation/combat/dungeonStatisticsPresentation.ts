import { DUNGEONS } from '../../content/dungeons/dungeons'
import { ITEMS } from '../../content/items/items'
import { formatCompactDuration, formatNumber } from '../../utils'
import { averageBossMs, averageEncounterMs, hasMinimumRateSample, ratePerHour, runsPerHour, totalLootQuantity as selectTotalLootQuantity } from '../../telemetry/dungeon/dungeonStatisticsSelectors'
import type { DungeonStatisticsSession } from '../../telemetry/dungeon/dungeonStatisticsTypes'
import type { ItemId } from '../../types'

export const formatStatisticsTime = (value: number | null) => value === null ? '—' : formatCompactDuration(value)
export const formatStatisticsRate = (value: number) => `${Math.max(0, Number.isFinite(value) ? value : 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} /h`
export const formatStatisticsRateForSession = (value: number, session: DungeonStatisticsSession | null) => hasMinimumRateSample(session) ? formatStatisticsRate(value) : 'MEASURING...'

export interface DungeonDropRowPresentation {
  itemId: ItemId
  name: string
  quantity: number
  perHour: number
  perHourLabel: string
  icon: string
}

/** @deprecated Use DungeonDropRowPresentation. */
export type DungeonLootRowPresentation = DungeonDropRowPresentation

export function getDungeonStatisticsPresentation(session: DungeonStatisticsSession | null) {
  const rateSampleReady = hasMinimumRateSample(session)
  const runsRate = runsPerHour(session)
  const dropRows: DungeonDropRowPresentation[] = session
    ? (Object.entries(session.lootByItemId) as [ItemId, number][]).filter(([, quantity]) => quantity > 0).sort((left, right) => right[1] - left[1] || ITEMS[left[0]].name.localeCompare(ITEMS[right[0]].name) || left[0].localeCompare(right[0])).map(([itemId, quantity]) => { const perHour = ratePerHour(quantity, session); return { itemId, name: ITEMS[itemId].name, quantity, perHour, perHourLabel: formatStatisticsRateForSession(perHour, session), icon: ITEMS[itemId].icon } })
    : []
  const uptime = session && session.elapsedMs > 0 ? Math.min(100, session.engagedMs / session.elapsedMs * 100) : 0
  const totalDrops = selectTotalLootQuantity(session)
  const dropsPerHour = ratePerHour(totalDrops, session)
  return {
    dungeonName: session ? DUNGEONS[session.dungeonId].name : null,
    sessionTime: session ? formatCompactDuration(session.elapsedMs) : '—',
    fullRuns: session?.completedRuns ?? 0,
    runsPerHour: runsRate,
    runsPerHourLabel: runsRate === null ? '—' : formatStatisticsRateForSession(runsRate, session),
    currentRunTime: session ? formatCompactDuration(session.currentRunElapsedMs) : '—',
    averageRunTime: formatStatisticsTime(session && session.completedRuns > 0 ? session.completedRunDurationTotalMs / session.completedRuns : null),
    bestRunTime: formatStatisticsTime(session?.bestRunMs ?? null),
    totalDrops,
    dropsPerHour,
    dropsPerHourLabel: formatStatisticsRateForSession(dropsPerHour, session),
    rateSampleReady,
    dropRows,
    uptime,
    downtime: Math.max(0, 100 - uptime),
    averageEncounter: formatStatisticsTime(averageEncounterMs(session)),
    averageBoss: formatStatisticsTime(averageBossMs(session)),
    fastestEncounter: formatStatisticsTime(session?.fastestEncounterMs ?? null),
    fastestBoss: formatStatisticsTime(session?.fastestBossMs ?? null),
    totalDropsLabel: formatNumber(totalDrops),
  }
}
