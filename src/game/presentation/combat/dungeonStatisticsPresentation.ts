import { DUNGEONS } from '../../content/dungeons/dungeons'
import { ITEMS } from '../../content/items/items'
import { formatCompactDuration } from '../../utils'
import { averageBossMs, averageEncounterMs, ratePerHour, runsPerHour, totalLootQuantity as selectTotalLootQuantity } from '../../telemetry/dungeon/dungeonStatisticsSelectors'
import type { DungeonStatisticsSession } from '../../telemetry/dungeon/dungeonStatisticsTypes'
import type { ItemId } from '../../types'
import { formatUiCount, formatUiPercent, formatUiRate } from '../numbers'

const missingValue = '—'

export const formatStatisticsTime = (value: number | null) => value === null ? missingValue : formatCompactDuration(value)
export const formatStatisticsRate = (value: number) => formatUiRate(value, '/h')

export interface DungeonDropRowPresentation {
  itemId: ItemId
  name: string
  quantity: number
  perHour: number
  perHourLabel: string
  icon: string
}

export interface DungeonStatisticsAggregatePresentation {
  dungeonName: string | null
  fullRuns: number
  averageRunTime: string
  bestRunTime: string
  totalDrops: number
  totalDropsLabel: string
  averageEncounter: string
  averageBoss: string
  fastestEncounter: string
  fastestBoss: string
  dropRows: DungeonDropRowPresentation[]
}

export interface DungeonStatisticsClockPresentation {
  sessionTime: string
  runsPerHour: number | null
  runsPerHourLabel: string
  currentRunTime: string
  dropsPerHour: number
  dropsPerHourLabel: string
  uptime: number
  downtime: number
  uptimeLabel: string
  downtimeLabel: string
}

/** @deprecated Use DungeonDropRowPresentation. */
export type DungeonLootRowPresentation = DungeonDropRowPresentation

export const getDungeonDropRateLabel = (quantity: number, elapsedMs: number) => elapsedMs > 0 ? formatStatisticsRate(quantity * 3_600_000 / elapsedMs) : missingValue

export function getDungeonStatisticsAggregatePresentation(session: DungeonStatisticsSession | null): DungeonStatisticsAggregatePresentation {
  const dropRows: DungeonDropRowPresentation[] = session
    ? (Object.entries(session.lootByItemId) as [ItemId, number][])
      .filter(([, quantity]) => quantity > 0)
      .sort((left, right) => right[1] - left[1] || ITEMS[left[0]].name.localeCompare(ITEMS[right[0]].name) || left[0].localeCompare(right[0]))
      .map(([itemId, quantity]) => ({ itemId, name: ITEMS[itemId].name, quantity, perHour: 0, perHourLabel: missingValue, icon: ITEMS[itemId].icon }))
    : []
  const totalDrops = selectTotalLootQuantity(session)
  return {
    dungeonName: session ? DUNGEONS[session.dungeonId].name : null,
    fullRuns: session?.completedRuns ?? 0,
    averageRunTime: formatStatisticsTime(session && session.completedRuns > 0 ? session.completedRunDurationTotalMs / session.completedRuns : null),
    bestRunTime: formatStatisticsTime(session?.bestRunMs ?? null),
    totalDrops,
    totalDropsLabel: formatUiCount(totalDrops),
    averageEncounter: formatStatisticsTime(averageEncounterMs(session)),
    averageBoss: formatStatisticsTime(averageBossMs(session)),
    fastestEncounter: formatStatisticsTime(session?.fastestEncounterMs ?? null),
    fastestBoss: formatStatisticsTime(session?.fastestBossMs ?? null),
    dropRows,
  }
}

export function getDungeonStatisticsClockPresentation(session: Pick<DungeonStatisticsSession, 'elapsedMs' | 'engagedMs' | 'completedRuns' | 'currentRunElapsedMs' | 'totalLootQuantity'> | null): DungeonStatisticsClockPresentation {
  const hasRateDenominator = Boolean(session && session.elapsedMs > 0)
  const runsRate = runsPerHour(session)
  const uptime = session && session.elapsedMs > 0 ? Math.min(100, session.engagedMs / session.elapsedMs * 100) : 0
  const dropsPerHour = ratePerHour(session?.totalLootQuantity ?? 0, session)
  return {
    sessionTime: session ? formatCompactDuration(session.elapsedMs) : missingValue,
    runsPerHour: runsRate,
    runsPerHourLabel: runsRate === null || !hasRateDenominator ? missingValue : formatStatisticsRate(runsRate),
    currentRunTime: session ? formatCompactDuration(session.currentRunElapsedMs) : missingValue,
    dropsPerHour,
    dropsPerHourLabel: hasRateDenominator ? formatStatisticsRate(dropsPerHour) : missingValue,
    uptime,
    downtime: Math.max(0, 100 - uptime),
    uptimeLabel: formatUiPercent(uptime),
    downtimeLabel: formatUiPercent(Math.max(0, 100 - uptime)),
  }
}

export function getDungeonStatisticsPresentation(session: DungeonStatisticsSession | null) {
  const aggregate = getDungeonStatisticsAggregatePresentation(session)
  const clock = getDungeonStatisticsClockPresentation(session ? { ...session, totalLootQuantity: aggregate.totalDrops } : null)
  const dropRows = aggregate.dropRows.map((row) => ({
    ...row,
    perHour: session ? ratePerHour(row.quantity, session) : 0,
    perHourLabel: session && session.elapsedMs > 0 ? getDungeonDropRateLabel(row.quantity, session.elapsedMs) : missingValue,
  }))
  return { ...aggregate, ...clock, dropRows }
}
