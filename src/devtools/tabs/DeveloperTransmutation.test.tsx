import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { DeveloperTransmutation } from './DeveloperTransmutation'

describe('Developer Transmutation controls', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('reveals locked recipes for inspection without changing unlock progress', () => {
    render(<DeveloperTransmutation />)
    expect(screen.queryByText('Ember Staff')).toBeNull()
    expect(screen.getByText('Prismatic Fragment')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'SHOW LOCKED RECIPES' }))
    expect(useGameStore.getState().debug.showLockedTransmutationRecipes).toBe(true)
    expect(useGameStore.getState().progress.lifetimeKillsByMonster['grove-sentinel']).toBeUndefined()
    expect(screen.getByRole('button', { name: 'HIDE LOCKED RECIPES' })).toBeTruthy()
  })
})
