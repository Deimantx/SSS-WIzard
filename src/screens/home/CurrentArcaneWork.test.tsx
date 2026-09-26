import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { prepareResearchAction } from '../../store/actions/researchActions'
import { CurrentArcaneWork } from './CurrentArcaneWork'

describe('CurrentArcaneWork', () => {
  beforeEach(() => useGameStore.getState().resetSave())

  it('summarizes active Channeling, Research, and Transmutation work', () => {
    const state = createInitialState()
    state.activities.channeling.acolytesAssigned = 3
    state.inventory['fire-fragment'] = 10
    state.inventory['water-fragment'] = 10
    prepareResearchAction(state, 'fire-fragment', 'fire', 5)
    prepareResearchAction(state, 'water-fragment', 'water', 5)
    state.activities.research.slots['research-1']!.acolyteAssigned = true
    state.activities.research.slots['research-2']!.acolyteAssigned = true
    state.activities.transmutation.jobs['fire-fragment'] = { acolyteAssigned: true, echoesAssigned: 0, progressMs: 0 }
    state.activities.transmutation.jobs['water-fragment'] = { acolyteAssigned: true, echoesAssigned: 0, progressMs: 0 }
    useGameStore.getState().hydrateState(state)
    render(<CurrentArcaneWork />)

    expect(screen.getByText('3 Acolytes · +6 Flux/s total.')).toBeTruthy()
    expect(screen.getByText(/2 prepared batches · 2 Acolytes ·/)).toBeTruthy()
    expect(screen.getByText('2 active recipes · 2 Acolytes · Flux funded.')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: /OPEN/ })[1])
    expect(useGameStore.getState().ui.screen).toBe('tower-research')
  })
})
