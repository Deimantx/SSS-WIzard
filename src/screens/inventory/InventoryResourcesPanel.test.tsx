import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { InventoryResourcesPanel } from './InventoryResourcesPanel'

describe('InventoryResourcesPanel', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('renders all four Resonance balances, including zero values', () => {
    render(<InventoryResourcesPanel />)

    expect(screen.getByText('RESOURCES')).toBeTruthy()
    expect(screen.getByText('Fire Resonance')).toBeTruthy()
    expect(screen.getByText('Water Resonance')).toBeTruthy()
    expect(screen.getByText('Earth Resonance')).toBeTruthy()
    expect(screen.getByText('Air Resonance')).toBeTruthy()
    expect(screen.getAllByText('0')).toHaveLength(4)
  })

  it('reacts to the canonical GameState Resonance balance', () => {
    render(<InventoryResourcesPanel />)
    act(() => useGameStore.getState().debugSetResonance('air', 210))

    expect(screen.getByText('210')).toBeTruthy()
  })
})
