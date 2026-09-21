import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { CombatResonanceSummary } from './CombatResonanceSummary'

describe('CombatResonanceSummary', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('shows all four persisted Resonance balances outside Inventory', () => {
    const state = createInitialState()
    state.resonance = { fire: 2, water: 4, earth: 32, air: 20 }
    useGameStore.setState(state)

    render(<CombatResonanceSummary />)

    expect(screen.getByText('RESONANCE HARVEST')).toBeTruthy()
    expect(screen.getByText('Fire')).toBeTruthy()
    expect(screen.getByText('Water')).toBeTruthy()
    expect(screen.getByText('Earth')).toBeTruthy()
    expect(screen.getByText('Air')).toBeTruthy()
    expect(screen.getByText('32')).toBeTruthy()
  })
})
