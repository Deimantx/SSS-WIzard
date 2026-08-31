import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { ITEMS } from '../../game/content/items/items'
import type { DungeonStatisticsSession } from '../../game/telemetry/dungeon/dungeonStatisticsTypes'
import { useDungeonStatisticsStore } from '../../game/telemetry/dungeon/dungeonStatisticsStore'
import { resetAllUiPreferences, setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { DungeonStatisticsPanel } from './DungeonStatisticsPanel'

const makeSession = (): DungeonStatisticsSession => ({
  dungeonId: 'whispering-woods', startedAtMs: 0, elapsedMs: 3_600_000, engagedMs: 3_000_000,
  completedRuns: 2, currentRunElapsedMs: 60_000, completedRunDurationTotalMs: 600_000, bestRunMs: 280_000,
  normalEncounterCount: 4, normalEncounterDurationTotalMs: 40_000, fastestEncounterMs: 8_000,
  bossEncounterCount: 2, bossDurationTotalMs: 60_000, fastestBossMs: 28_000,
  totalLootQuantity: 0, lootByItemId: {},
})

describe('DungeonStatisticsPanel V3.7', () => {
  beforeEach(() => { resetAllUiPreferences(); useDungeonStatisticsStore.getState().clear() })

  it('uses the 50/50 panel language and renders every recorded drop', () => {
    const allItemIds = Object.keys(ITEMS) as Array<keyof typeof ITEMS>
    const lootByItemId = Object.fromEntries(allItemIds.map((itemId, index) => [itemId, index + 1])) as DungeonStatisticsSession['lootByItemId']
    useDungeonStatisticsStore.setState({ active: true, session: { ...makeSession(), totalLootQuantity: allItemIds.length * (allItemIds.length + 1) / 2, lootByItemId }, currentEncounter: null })
    setUiPreferences({ screenState: { combat: { dungeonStatisticsMode: 'drops' } } })

    render(<TooltipProvider><DungeonStatisticsPanel /></TooltipProvider>)

    expect(screen.getAllByText('DROPS').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('LOOT')).toBeNull()
    expect(screen.queryByText('TOP DROPS')).toBeNull()
    expect(document.querySelectorAll('.dungeon-statistics-drop-row')).toHaveLength(allItemIds.length)
    expect(document.querySelector('.dungeon-statistics-drop-quantity')).toBeNull()
    expect(document.querySelector('.dungeon-statistics-drop-rate')?.textContent).toMatch(/\/h$/)
  })

  it('keeps Runs and Efficiency as distinct KPI-focused modes', () => {
    const user = userEvent.setup()
    useDungeonStatisticsStore.setState({ active: true, session: makeSession(), currentEncounter: null })
    render(<TooltipProvider><DungeonStatisticsPanel /></TooltipProvider>)
    expect(screen.getByText('SESSION')).toBeTruthy()
    expect(screen.getByText('FULL RUNS')).toBeTruthy()

    return user.click(screen.getByRole('button', { name: 'Next Dungeon Statistics mode' })).then(() => user.click(screen.getByRole('button', { name: 'Next Dungeon Statistics mode' }))).then(() => {
    expect(screen.getByText('COMBAT UPTIME')).toBeTruthy()
    expect(screen.getByText('FASTEST BOSS')).toBeTruthy()
    })
  })
})
