import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { DeveloperWorldTier } from './DeveloperWorldTier'

describe('Developer World Tier tab', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('shows definitions, active-vs-current state, and canonical preview values', () => {
    render(<DeveloperWorldTier />)
    expect(screen.getByText('WT1 · World Tier 1')).toBeTruthy()
    expect(screen.getByText('WT2 · World Tier 2')).toBeTruthy()
    expect(screen.getByText('NO ACTIVE ENCOUNTER')).toBeTruthy()
    expect(screen.getAllByText(/from 200/)).toHaveLength(2)
  })

  it('routes unlock, selection, and reset through World Tier store actions', () => {
    render(<DeveloperWorldTier />)
    fireEvent.click(screen.getByRole('button', { name: 'UNLOCK WT2' }))
    expect(useGameStore.getState().worldTier.highestUnlocked).toBe(2)
    fireEvent.click(screen.getByRole('button', { name: 'SET CURRENT WT2' }))
    expect(useGameStore.getState().worldTier.current).toBe(2)
    fireEvent.click(screen.getByRole('button', { name: 'RESET UNLOCKS TO WT1' }))
    expect(useGameStore.getState().worldTier).toEqual({ current: 1, highestUnlocked: 1 })
  })
})
