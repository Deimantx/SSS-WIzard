import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { combatTelemetryObserver, useCombatTelemetryStore } from '../../game/telemetry/combat/combatTelemetryStore'
import { resetAllUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { CombatDetailsPanel } from './CombatDetailsPanel'

const damageEvent = (amount: number, source: 'spell' | 'basic-attack' = 'spell') => ({ source: { kind: 'player' as const }, sourceKind: source, sourceId: source === 'spell' ? 'fire-bolt' : 'player-basic', spellId: source === 'spell' ? 'fire-bolt' as const : undefined, target: 'enemy' as const, targetMonsterId: 'grove-sentinel' as const, category: source, amount, healthDamage: amount, barrierAbsorbed: 0, damageType: 'fire' as const })

describe('CombatDetailsPanel', () => {
  beforeEach(() => { window.localStorage.clear(); resetAllUiPreferences(); useCombatTelemetryStore.getState().clear() })

  it('shows the empty state without a current or completed run', () => {
    render(<TooltipProvider><CombatDetailsPanel /></TooltipProvider>)
    expect(screen.getByText('COMBAT DETAILS')).toBeTruthy()
    expect(screen.getByText('CURRENT RUN')).toBeTruthy()
    expect(screen.getByText('NO COMBAT DATA')).toBeTruthy()
    expect(screen.getByText('Enter a Dungeon to begin tracking.')).toBeTruthy()
  })

  it('cycles modes with icon navigation and remembers the local UI preference', async () => {
    const user = userEvent.setup()
    combatTelemetryObserver.beginRun('whispering-woods')
    combatTelemetryObserver.consume(damageEvent(120))
    const view = render(<TooltipProvider><CombatDetailsPanel /></TooltipProvider>)

    expect(screen.getByText('DAMAGE DONE')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Next Combat Details metric' }))
    expect(screen.getByText('DAMAGE TAKEN')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Next Combat Details metric' }))
    expect(screen.getByText('HEALING')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Previous Combat Details metric' }))
    expect(screen.getByText('DAMAGE TAKEN')).toBeTruthy()
    view.unmount()

    render(<TooltipProvider><CombatDetailsPanel /></TooltipProvider>)
    expect(screen.getByText('DAMAGE TAKEN')).toBeTruthy()
  })

  it('renders ranked source rows from the Player run aggregate', () => {
    combatTelemetryObserver.beginRun('whispering-woods')
    combatTelemetryObserver.consume(damageEvent(120))
    combatTelemetryObserver.consume(damageEvent(30, 'basic-attack'))
    render(<TooltipProvider><CombatDetailsPanel /></TooltipProvider>)

    expect(screen.getByText('Fire Bolt')).toBeTruthy()
    expect(screen.getByText('Basic Attack')).toBeTruthy()
    expect(screen.getByText('80.0%')).toBeTruthy()
    expect(screen.getByText('20.0%')).toBeTruthy()
    expect(screen.getByLabelText('1. Fire Bolt, 80.0%, 120')).toBeTruthy()
  })
})
