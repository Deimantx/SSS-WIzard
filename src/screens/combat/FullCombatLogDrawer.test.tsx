import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { combatLogUiSink, clearCombatLogUi } from '../../game/ui/combatLogStore'
import { resetAllUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { FullCombatLogDrawer } from './FullCombatLogDrawer'

describe('FullCombatLogDrawer', () => {
  beforeEach(() => { window.localStorage.clear(); resetAllUiPreferences(); clearCombatLogUi() })

  it('reuses the log font preference and filters by source', async () => {
    const user = userEvent.setup()
    combatLogUiSink.push({ source: { kind: 'enemy', monsterId: 'forest-wisp' }, target: 'player', category: 'damage', damageType: 'physical', amount: 5, timestampMs: 1 })
    combatLogUiSink.push({ source: { kind: 'player' }, target: 'enemy', targetMonsterId: 'forest-wisp', category: 'damage', damageType: 'fire', amount: 8, timestampMs: 2 })
    render(<TooltipProvider><FullCombatLogDrawer onClose={() => undefined} /></TooltipProvider>)

    await user.click(screen.getByRole('tab', { name: 'ENEMY' }))
    await user.click(screen.getByRole('button', { name: 'Combat Log text size' }))
    await user.click(screen.getByRole('option', { name: 'Extra Large' }))

    expect(document.querySelector('.full-combat-log-drawer')?.classList.contains('combat-log-size-xlarge')).toBe(true)
    expect(screen.getByText('5 PHYSICAL DAMAGE')).toBeTruthy()
    expect(screen.queryByText('8 FIRE DAMAGE')).toBeNull()
  })

  it('closes from the close button, Escape, and outside click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<TooltipProvider><FullCombatLogDrawer onClose={onClose} /></TooltipProvider>)
    expect(screen.getByRole('dialog', { name: 'Full Combat Log' })).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Close Full Combat Log' }))
    expect(onClose).toHaveBeenCalledTimes(2)
    const layer = document.querySelector('.full-combat-log-layer')
    if (layer) await user.click(layer)
    expect(onClose).toHaveBeenCalledTimes(3)
  })
})
