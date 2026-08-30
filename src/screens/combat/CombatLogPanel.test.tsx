import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { combatLogUiSink, clearCombatLogUi } from '../../game/ui/combatLogStore'
import { resetAllUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { CombatLogPanel } from './CombatLogPanel'

describe('CombatLogPanel V3.2', () => {
  beforeEach(() => { window.localStorage.clear(); resetAllUiPreferences(); clearCombatLogUi() })

  it('changes font size without resetting the source filter', async () => {
    const user = userEvent.setup()
    combatLogUiSink.push({ source: { kind: 'enemy', monsterId: 'forest-wisp' }, target: 'player', category: 'damage', damageType: 'physical', amount: 5, timestampMs: 1 })
    render(<TooltipProvider><CombatLogPanel /></TooltipProvider>)

    await user.click(screen.getByRole('tab', { name: 'ENEMY' }))
    await user.click(screen.getByRole('button', { name: 'Combat Log text size' }))
    await user.click(screen.getByRole('option', { name: 'Extra Large' }))

    expect(document.querySelector('.combat-log-panel')?.classList.contains('combat-log-size-xlarge')).toBe(true)
    expect(screen.getByRole('tab', { name: 'ENEMY' }).classList.contains('active')).toBe(true)
  })

  it('collapses the feed to a compact latest-event summary and restores it', async () => {
    const user = userEvent.setup()
    combatLogUiSink.push({ source: { kind: 'player' }, target: 'enemy', targetMonsterId: 'forest-wisp', category: 'damage', damageType: 'fire', amount: 48, timestampMs: 1 })
    render(<TooltipProvider><CombatLogPanel /></TooltipProvider>)

    await user.click(screen.getByRole('button', { name: 'Collapse Combat Log' }))
    expect(document.querySelector('.combat-log-panel')?.classList.contains('is-collapsed')).toBe(true)
    expect(document.querySelector('.combat-log-scroll')).toBeNull()
    expect(screen.getByText(/LAST/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Expand Combat Log' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Expand Combat Log' }))
    expect(document.querySelector('.combat-log-panel')?.classList.contains('is-collapsed')).toBe(false)
    expect(document.querySelector('.combat-log-scroll')).toBeTruthy()
  })
})
