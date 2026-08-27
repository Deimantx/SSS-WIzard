import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { prepareResearchAction } from '../../../store/actions/researchActions'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { ResearchLibrary } from './ResearchLibrary'

const seed = (fire = 20, water = 20) => {
  const state = createInitialState()
  state.inventory['fire-fragment'] = fire
  state.inventory['water-fragment'] = water
  useGameStore.getState().hydrateState(state)
}

describe('ResearchLibrary', () => {
  beforeEach(() => { useGameStore.getState().resetSave(); resetAllUiPreferences() })

  it('filters by native affinity and reports tile selection', () => {
    seed()
    const onSelect = vi.fn()
    render(<ResearchLibrary selectedItemId="fire-fragment" onSelect={onSelect} />)

    expect(screen.getByRole('button', { name: /Fire Fragment/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Water Fragment/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'WATER' }))

    expect(screen.queryByRole('button', { name: /Fire Fragment/ })).toBeNull()
    const waterTile = screen.getByRole('button', { name: /Water Fragment/ })
    fireEvent.click(waterTile)
    expect(onSelect).toHaveBeenCalledWith('water-fragment')
    expect(JSON.parse(window.localStorage.getItem('sss-wizard-ui-preferences-v1')!).screenState.research.affinityFilter).toBe('water')
  })

  it('shows reservation-adjusted availability and shared tooltip triggers', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 100
    prepareResearchAction(state, 'fire-fragment', 'fire', 25)
    useGameStore.getState().hydrateState(state)
    render(<ResearchLibrary selectedItemId="fire-fragment" onSelect={vi.fn()} />)

    expect(screen.getByText(/25 PREPARED/)).toBeTruthy()
    expect(screen.getByText(/75 available/)).toBeTruthy()
    expect(document.querySelectorAll('.game-tooltip-trigger').length).toBeGreaterThan(0)
    expect(document.querySelector('[title]')).toBeNull()
  })
})
