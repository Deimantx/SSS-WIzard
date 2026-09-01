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
    expect(presentation.currentRunTime).not.toBe('')
    expect(presentation.averageRunTime).not.toBe('')
    expect(presentation.bestRunTime).not.toBe('')
  })

  it('uses the canonical session denominator for total and item rates', () => {
    const tenMinuteSession = { ...session({ 'wisp-essence': 25, 'life-essence': 75 }), elapsedMs: 600_000 }
    const presentation = getDungeonStatisticsPresentation(tenMinuteSession)

    expect(presentation.totalDrops).toBe(100)
    expect(presentation.dropsPerHour).toBe(600)
    expect(presentation.dropRows.find((row) => row.itemId === 'wisp-essence')?.perHour).toBe(150)
    expect(presentation.dropsPerHourLabel).toBe('600 /h')
  })

  it('shows a projected hourly label immediately without a separate sample warning', () => {
    const shortSession = { ...session({ 'wisp-essence': 1 }), elapsedMs: 30_000 }
    const presentation = getDungeonStatisticsPresentation(shortSession)

    expect(presentation.dropsPerHour).toBe(120)
    expect(presentation.dropsPerHourLabel).toBe('120 /h')
    expect(presentation.dropRows[0].perHourLabel).toBe('120 /h')
    expect('earlySample' in presentation).toBe(false)
    expect(getDungeonStatisticsPresentation({ ...shortSession, elapsedMs: 60_000 }).dropsPerHourLabel).toBe('60 /h')
  })

  it('derives visible total items from the per-item quantities', () => {
    const presentation = getDungeonStatisticsPresentation({ ...session({ 'wisp-essence': 25, 'life-essence': 40, 'grove-bark': 10, heartseed: 2 }), totalLootQuantity: 999 })

    expect(presentation.totalDrops).toBe(77)
    expect(presentation.totalDropsLabel).toBe('77')
  })
})
