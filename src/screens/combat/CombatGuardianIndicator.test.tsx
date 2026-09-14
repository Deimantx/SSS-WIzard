import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { SUMMONING_UNLOCK_BOSS_ID } from '../../game/content/guardians/guardians'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { CombatGuardianIndicator } from './CombatGuardianIndicator'

describe('Combat Guardian indicator', () => {
  beforeEach(() => useGameStore.getState().hydrateState(createInitialState()))

  it('renders nothing before Summoning is unlocked, even with malformed selection state', () => {
    const state = createInitialState()
    state.guardians.selectedGuardianId = 'fire-guardian'
    state.combat.active = true
    useGameStore.getState().hydrateState(state)

    render(<TooltipProvider><CombatGuardianIndicator /></TooltipProvider>)

    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByText('FIRE GUARDIAN')).toBeNull()
  })

  it('shows only compact post-unlock binding state', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss[SUMMONING_UNLOCK_BOSS_ID] = 1
    state.guardians.selectedGuardianId = 'air-guardian'
    state.combat.active = true
    useGameStore.getState().hydrateState(state)

    render(<TooltipProvider><CombatGuardianIndicator /></TooltipProvider>)

    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByText('AIR GUARDIAN')).toBeTruthy()
    expect(screen.getByText('BOUND · NEXT ENCOUNTER')).toBeTruthy()
  })
})
