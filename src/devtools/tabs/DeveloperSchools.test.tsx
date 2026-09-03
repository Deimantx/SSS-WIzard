import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { DeveloperSchools } from './DeveloperSchools'

describe('Developer School controls', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('sets an exact level start and derives a level from total XP', () => {
    render(<DeveloperSchools />)
    const fields = screen.getAllByRole('spinbutton')
    fireEvent.change(fields[1], { target: { value: '8' } })
    expect(useGameStore.getState().schools.fire).toEqual({ level: 8, xp: 2070 })

    fireEvent.change(fields[0], { target: { value: '240' } })
    expect(useGameStore.getState().schools.fire).toEqual({ level: 3, xp: 240 })
  })

  it('exposes the authored Level 40 quick control', () => {
    render(<DeveloperSchools />)
    expect(screen.getByRole('button', { name: 'Set all to Level 40' })).toBeTruthy()
  })
})
