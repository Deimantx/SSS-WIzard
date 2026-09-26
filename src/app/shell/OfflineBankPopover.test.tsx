import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore, type GameStore } from '../../store/gameStore'
import type { OfflineBankProgress, OfflineBankResult } from '../../game/systems/offline-bank/offlineBankSimulation'
import { OfflineBankPopover } from './OfflineBankPopover'

describe('OfflineBankPopover', () => {
  beforeEach(() => useGameStore.getState().resetSave())

  it('shows live simulated progress and finalizing state while advancing', async () => {
    const state = createInitialState()
    state.offlineBankMs = 3_600_000
    state.activities.transmutation.jobs['fire-fragment'] = { acolyteAssigned: true, progressMs: 0 }
    useGameStore.getState().hydrateState(state)

    let progressCallback: ((progress: OfflineBankProgress) => void) | undefined
    let resolveAdvance: ((result: OfflineBankResult) => void) | undefined
    const advance = vi.fn((_durationMs: number, onProgress?: (progress: OfflineBankProgress) => void) => {
      progressCallback = onProgress
      return new Promise<OfflineBankResult>((resolve) => { resolveAdvance = resolve })
    })
    useGameStore.setState({ advanceWithOfflineBank: advance as GameStore['advanceWithOfflineBank'] })

    render(<OfflineBankPopover open onClose={vi.fn()} onViewLastResults={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Advance 1h' }))

    await waitFor(() => expect(advance).toHaveBeenCalled())
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0')
    expect(screen.getByText('SIMULATING')).toBeTruthy()

    act(() => progressCallback?.({ phase: 'simulating', percent: 37.4 }))
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('37')
    expect(screen.getByText('37%')).toBeTruthy()

    act(() => progressCallback?.({ phase: 'finalizing', percent: 100 }))
    expect(screen.getByText('FINALIZING')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100')

    await act(async () => resolveAdvance?.({ ok: true }))
    await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull())
  })
})
