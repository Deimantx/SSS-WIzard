import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { CombatStatusStrip } from './CombatStatusStrip'

describe('CombatStatusStrip Elemental Ward presentation', () => {
  beforeEach(() => {
    useGameStore.getState().resetSave()
  })

  it('shows a Fire Ward as a timed player effect and explains its reduction', async () => {
    const state = useGameStore.getState()
    useGameStore.setState({ combat: { ...state.combat, active: true, arcaneCoreRuntime: { ...state.combat.arcaneCoreRuntime, elapsedMs: 5_000 }, elementalDamageReductions: [{ element: 'fire', reduction: 0.15, sourceId: 'fire-ward', expiresAt: 25_000, durationMs: 20_000 }] } })
    render(<TooltipProvider><CombatStatusStrip actor="player" label="ACTIVE EFFECTS" /></TooltipProvider>)

    expect(screen.getByRole('region', { name: 'ACTIVE EFFECTS' })).toBeTruthy()
    expect(screen.getByText('FIRE WARD')).toBeTruthy()
    expect(screen.getByText('20.0s')).toBeTruthy()
    fireEvent.pointerEnter(screen.getByText('FIRE WARD'))
    expect(await screen.findByText('Incoming Fire Damage: -15%', {}, { timeout: 1200 })).toBeTruthy()
    expect(screen.getByText('Duration: 20.0s')).toBeTruthy()

    const live = useGameStore.getState()
    useGameStore.setState({ combat: { ...live.combat, arcaneCoreRuntime: { ...live.combat.arcaneCoreRuntime, elapsedMs: 25_000 } } })
    await waitFor(() => expect(screen.queryByText('FIRE WARD')).toBeNull())
  })
})
