import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { CombatRunBar } from './CombatRunBar'

describe('CombatRunBar world terminology', () => {
  beforeEach(() => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    useGameStore.setState(state)
  })

  it('uses the active Location label and keeps only current-run management actions', () => {
    render(<TooltipProvider><CombatRunBar selectedDungeonId="whispering-woods" onRequestLeave={vi.fn()} /></TooltipProvider>)

    expect(screen.getByText('CURRENT LOCATION')).toBeTruthy()
    expect(screen.getByText(/COMBAT ZONE ·/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'LEAVE' })).toBeTruthy()
    expect(screen.queryByText('CAMPAIGN')).toBeNull()
    expect(screen.queryByRole('button', { name: /ENTER/ })).toBeNull()
  })
})
