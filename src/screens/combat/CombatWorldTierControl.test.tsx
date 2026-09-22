import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { CombatWorldTierControl } from './CombatWorldTierControl'

describe('CombatWorldTierControl', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('shows WT1 with WT2 through WT5 controls locked on a fresh profile', () => {
    render(<CombatWorldTierControl />)

    expect(screen.getByText('WORLD TIER')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'WT1' })).not.toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'WT2' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'WT3' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'WT4' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'WT5' })).toHaveProperty('disabled', true)
    expect(screen.getByText('WT2 unlocks after Chapter 1.')).toBeTruthy()
  })

  it('disables normal tier switching while combat is active', () => {
    const state = createInitialState()
    state.worldTier = { current: 2, highestUnlocked: 2 }
    state.combat.active = true
    useGameStore.setState(state)

    render(<CombatWorldTierControl />)

    expect(screen.getByRole('button', { name: 'WT1' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'WT2' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'WT3' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'WT4' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'WT5' })).toHaveProperty('disabled', true)
    expect(screen.getByText('LOCKED DURING COMBAT')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'WT1' }))
    expect(useGameStore.getState().worldTier.current).toBe(2)
  })
})
