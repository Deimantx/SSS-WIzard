import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { InventoryResourcesPanel } from './InventoryResourcesPanel'
import { RESONANCE_METADATA, RESONANCE_TYPES } from '../../game/content/resonance/resonance'

describe('InventoryResourcesPanel', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('renders all Resonance balances, including zero values', () => {
    render(<InventoryResourcesPanel />)

    expect(screen.getByText('RESOURCES')).toBeTruthy()
    RESONANCE_TYPES.forEach((type) => expect(screen.getByText(RESONANCE_METADATA[type].label)).toBeTruthy())
    expect(screen.getAllByText('0')).toHaveLength(RESONANCE_TYPES.length)
  })

  it('reacts to the canonical GameState Resonance balance', () => {
    render(<InventoryResourcesPanel />)
    act(() => useGameStore.getState().debugSetResonance('air', 210))

    expect(screen.getByText('210')).toBeTruthy()
  })
})
