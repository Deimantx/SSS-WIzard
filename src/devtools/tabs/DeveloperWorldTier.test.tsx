import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { DeveloperWorldTier } from './DeveloperWorldTier'

describe('Developer World Tier tab', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('shows definitions, active-vs-current state, and canonical preview values', () => {
    render(<DeveloperWorldTier />)
    expect(screen.getByText(/WT1.*World Tier 1/)).toBeTruthy()
    expect(screen.getByText(/WT2.*World Tier 2/)).toBeTruthy()
    expect(screen.getByText(/WT3.*World Tier 3/)).toBeTruthy()
    expect(screen.getByText(/WT4.*World Tier 4/)).toBeTruthy()
    expect(screen.getByText(/WT5.*World Tier 5/)).toBeTruthy()
    expect(screen.getByText('NO ACTIVE ENCOUNTER')).toBeTruthy()
    expect(screen.getAllByText(/from 200/)).toHaveLength(5)
  })

  it('routes unlock, selection, and reset through World Tier store actions', () => {
    render(<DeveloperWorldTier />)
    fireEvent.click(screen.getByRole('button', { name: 'UNLOCK WT2' }))
    expect(useGameStore.getState().worldTier.highestUnlocked).toBe(2)
    fireEvent.click(screen.getByRole('button', { name: 'WT2' }))
    expect(useGameStore.getState().worldTier.current).toBe(2)
    fireEvent.click(screen.getByRole('button', { name: 'RESET UNLOCKS TO WT1' }))
    expect(useGameStore.getState().worldTier).toEqual({ current: 1, highestUnlocked: 1 })
  })

  it('unlocks WT5 through the generic action and exposes all current-tier controls', () => {
    render(<DeveloperWorldTier />)
    fireEvent.click(screen.getByRole('button', { name: 'UNLOCK ALL' }))
    expect(useGameStore.getState().worldTier.highestUnlocked).toBe(5)
    fireEvent.click(screen.getByRole('button', { name: 'WT5' }))
    expect(useGameStore.getState().worldTier.current).toBe(5)
    expect(screen.getByRole('button', { name: 'WT5' })).not.toHaveProperty('disabled', true)
  })
})
