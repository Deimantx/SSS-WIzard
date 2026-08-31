import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { resetAllUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { CombatAnalyticsPanel } from './CombatAnalyticsPanel'

describe('CombatAnalyticsPanel', () => {
  beforeEach(() => { window.localStorage.clear(); resetAllUiPreferences() })

  it('keeps Combat Details and Dungeon Statistics inside one parent split', () => {
    const { container } = render(<TooltipProvider><CombatAnalyticsPanel /></TooltipProvider>)
    expect(container.querySelector('.combat-analytics-panel')).toBeTruthy()
    expect(container.querySelectorAll('.combat-analytics-grid > .card')).toHaveLength(2)
    expect(container.querySelector('.combat-analytics-grid > .combat-details-panel')).toBeTruthy()
    expect(container.querySelector('.combat-analytics-grid > .dungeon-statistics-panel')).toBeTruthy()
  })
})
