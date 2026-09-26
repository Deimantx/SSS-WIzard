import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { AcolyteScreen } from './AcolyteScreen'

describe('AcolyteScreen', () => {
  beforeEach(() => useGameStore.getState().hydrateState(createInitialState()))

  it('renders five Channeling workers as one grouped assignment', () => {
    const state = createInitialState()
    state.activities.channeling.acolytesAssigned = 5
    useGameStore.getState().hydrateState(state)
    render(<AcolyteScreen />)

    expect(screen.getByText('5 ACOLYTES')).toBeTruthy()
    expect(screen.getByText('Leyline Channeling')).toBeTruthy()
    expect(screen.getByText('+10 FLUX/S')).toBeTruthy()
    expect(screen.getAllByText('CHANNELING')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'OPEN CHANNELING' })).toBeNull()
  })
})
