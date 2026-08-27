import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { prepareResearchAction, setResearchEchoesAction } from '../../store/actions/researchActions'
import { CurrentArcaneWork } from './CurrentArcaneWork'

describe('CurrentArcaneWork', () => {
  beforeEach(() => useGameStore.getState().resetSave())

  it('summarizes active Channeling, Research, and Transmutation work', () => {
    const state = createInitialState()
    state.activities.channeling.echoesAssigned = 3
    state.inventory['fire-fragment'] = 10
    state.inventory['water-fragment'] = 10
    prepareResearchAction(state, 'fire-fragment', 'fire', 5)
    prepareResearchAction(state, 'water-fragment', 'water', 5)
    setResearchEchoesAction(state, 'research-1', 2)
    setResearchEchoesAction(state, 'research-2', 2)
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }
    state.activities.transmutation.jobs['water-fragment'] = { echoesAssigned: 2, progressMs: 0 }
    useGameStore.getState().hydrateState(state)
    render(<CurrentArcaneWork />)

    expect(screen.getByText('3 Echoes · +20 Mana/s total.')).toBeTruthy()
    expect(screen.getByText('2 prepared batches · 4 Echoes · 34.6K XP/h.')).toBeTruthy()
    expect(screen.getByText('2 active recipes · 3 Echoes · Focus 30.')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: /OPEN/ })[1])
    expect(useGameStore.getState().ui.screen).toBe('tower-research')
  })
})
