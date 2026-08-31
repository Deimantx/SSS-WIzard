import { describe, expect, it } from 'vitest'
import { getDungeonStatisticsPresentation } from './dungeonStatisticsPresentation'
import type { DungeonStatisticsSession } from '../../telemetry/dungeon/dungeonStatisticsTypes'

const session = (lootByItemId: DungeonStatisticsSession['lootByItemId']): DungeonStatisticsSession => ({
  dungeonId: 'whispering-woods',
  startedAtMs: 0,
  elapsedMs: 3_600_000,
  engagedMs: 3_000_000,
  completedRuns: 2,
  currentRunElapsedMs: 120_000,
  completedRunDurationTotalMs: 600_000,
  bestRunMs: 280_000,
  normalEncounterCount: 4,
  normalEncounterDurationTotalMs: 40_000,
  fastestEncounterMs: 8_000,
  bossEncounterCount: 2,
  bossDurationTotalMs: 60_000,
  fastestBossMs: 28_000,
  totalLootQuantity: Object.values(lootByItemId).reduce((sum, amount) => sum + (amount ?? 0), 0),
  lootByItemId,
})

describe('dungeon statistics presentation', () => {
  it('exposes every recorded drop, sorted by quantity then name, with an hourly rate', () => {
    const presentation = getDungeonStatisticsPresentation(session({ 'life-essence': 3, 'wisp-essence': 12, 'grove-bark': 12, heartseed: 0 }))

    expect(presentation.dropRows.map((row) => row.itemId)).toEqual(['grove-bark', 'wisp-essence', 'life-essence'])
    expect(presentation.dropRows[0].perHour).toBe(12)
    expect(presentation.totalDrops).toBe(27)
    expect(presentation.dropsPerHour).toBe(27)
  })

  it('keeps the KPI hierarchy ready for a completed and current run', () => {
    const presentation = getDungeonStatisticsPresentation(session({}))

    expect(presentation.fullRuns).toBe(2)
    expect(presentation.runsPerHour).toBe(2)
    expect(presentation.currentRunTime).not.toBe('—')
    expect(presentation.averageRunTime).not.toBe('—')
    expect(presentation.bestRunTime).not.toBe('—')
  })
})
