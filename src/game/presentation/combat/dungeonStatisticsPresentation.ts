import { DUNGEONS } from '../../content/dungeons/dungeons'
import { ITEMS } from '../../content/items/items'
import { formatCompactDuration, formatNumber } from '../../utils'
import { averageBossMs, averageEncounterMs, ratePerHour, runsPerHour } from '../../telemetry/dungeon/dungeonStatisticsSelectors'
import type { DungeonStatisticsSession } from '../../telemetry/dungeon/dungeonStatisticsTypes'
import type { ItemId } from '../../types'

export const formatStatisticsTime = (value: number | null) => value === null ? '—' : formatCompactDuration(value)
export const formatStatisticsRate = (value: number) => `${value.toFixed(1)} /h`

export interface DungeonLootRowPresentation {
  itemId: ItemId
  name: string
  quantity: number
  perHour: number
  icon: string
}

export function getDungeonStatisticsPresentation(session: DungeonStatisticsSession | null) {
  const lootRows: DungeonLootRowPresentation[] = session
    ? (Object.entries(session.lootByItemId) as [ItemId, number][]).filter(([, quantity]) => quantity > 0).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).map(([itemId, quantity]) => ({ itemId, name: ITEMS[itemId].name, quantity, perHour: ratePerHour(quantity, session), icon: ITEMS[itemId].icon }))
    : []
  const uptime = session && session.elapsedMs > 0 ? Math.min(100, session.engagedMs / session.elapsedMs * 100) : 0
  return {
    dungeonName: session ? DUNGEONS[session.dungeonId].name : null,
    sessionTime: session ? formatCompactDuration(session.elapsedMs) : '—',
    fullRuns: session?.completedRuns ?? 0,
    runsPerHour: runsPerHour(session),
    currentRunTime: session ? formatCompactDuration(session.currentRunElapsedMs) : '—',
    averageRunTime: formatStatisticsTime(session && session.completedRuns > 0 ? session.completedRunDurationTotalMs / session.completedRuns : null),
    bestRunTime: formatStatisticsTime(session?.bestRunMs ?? null),
    totalLoot: session?.totalLootQuantity ?? 0,
    lootPerHour: session ? ratePerHour(session.totalLootQuantity, session) : 0,
    lootRows,
    uptime,
    downtime: Math.max(0, 100 - uptime),
    averageEncounter: formatStatisticsTime(averageEncounterMs(session)),
    averageBoss: formatStatisticsTime(averageBossMs(session)),
    fastestEncounter: formatStatisticsTime(session?.fastestEncounterMs ?? null),
    fastestBoss: formatStatisticsTime(session?.fastestBossMs ?? null),
    totalLootLabel: formatNumber(session?.totalLootQuantity ?? 0),
  }
}
