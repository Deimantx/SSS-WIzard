import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { DeveloperMonsters } from './DeveloperMonsters'
import { DeveloperSpells } from './DeveloperSpells'
import { DeveloperStatuses } from './DeveloperStatuses'

describe('Developer content browsers', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('filters monsters by dungeon and keeps the selected inspector runtime-backed', () => {
    render(<DeveloperMonsters />)
    fireEvent.click(screen.getByRole('tab', { name: 'HOWLING DEN' }))
    expect(screen.getAllByText('Cavefang Wolf').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Corrupted Greatbear').length).toBeGreaterThan(0)
    expect(screen.queryByText('Forest Wisp')).toBeNull()
    fireEvent.click(screen.getByRole('option', { name: /Corrupted Greatbear/ }))
    expect(screen.getByText('Combat stats')).toBeTruthy()
    expect(screen.getByText('900')).toBeTruthy()
  })

  it('filters statuses by authored classification and exposes real apply actions', () => {
    render(<DeveloperStatuses />)
    fireEvent.click(screen.getByRole('tab', { name: 'BUFFS' }))
    expect(screen.getAllByText('Quickening').length).toBeGreaterThan(0)
    expect(screen.queryByText('Burning')).toBeNull()
    fireEvent.click(screen.getByRole('option', { name: /Quickening/ }))
    expect(screen.getByRole('button', { name: 'Apply to player' })).toBeTruthy()
  })

  it('filters spells by school and shows the authored mana/cooldown inspector', () => {
    render(<DeveloperSpells />)
    fireEvent.click(screen.getByRole('tab', { name: 'FIRE' }))
    expect(screen.getAllByText('Fire Bolt').length).toBeGreaterThan(0)
    expect(screen.queryByText('Water Ward')).toBeNull()
    fireEvent.click(screen.getByRole('option', { name: /Fire Bolt/ }))
    expect(screen.getByText('12')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cast selected' })).toBeTruthy()
  })
})
