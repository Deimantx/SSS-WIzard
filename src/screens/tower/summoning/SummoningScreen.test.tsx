import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { SUMMONING_UNLOCK_BOSS_ID } from '../../../game/content/guardians/guardians'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { SummoningScreen } from './SummoningScreen'

describe('Summoning screen', () => {
  beforeEach(() => useGameStore.getState().hydrateState(createInitialState()))

  it('renders no player-facing chamber before the canonical unlock', () => {
    render(<TooltipProvider><SummoningScreen /></TooltipProvider>)

    expect(screen.queryByRole('heading', { name: 'Summoning' })).toBeNull()
    expect(screen.queryByText('Summoning chamber restored')).toBeNull()
  })

  it('renders the four Guardian cards after unlock and persists one selection', async () => {
    const user = userEvent.setup()
    const state = createInitialState()
    state.progress.bossKillsByBoss[SUMMONING_UNLOCK_BOSS_ID] = 1
    useGameStore.getState().hydrateState(state)

    render(<TooltipProvider><SummoningScreen /></TooltipProvider>)

    expect(screen.getByRole('heading', { name: 'Summoning' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'ELEMENTAL GUARDIANS' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Guardian$/ })).toHaveLength(4)
    await user.click(screen.getByRole('button', { name: 'Select Water Guardian' }))

    expect(useGameStore.getState().guardians.selectedGuardianId).toBe('water-guardian')
    expect(screen.getByRole('button', { name: 'Selected Water Guardian' }).getAttribute('aria-pressed')).toBe('true')
  })
})
