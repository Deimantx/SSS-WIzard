import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { DeveloperInventory } from './DeveloperInventory'

describe('DeveloperInventory selection safety', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('does not keep an actionable hidden item when a search has no matches', async () => {
    render(<DeveloperInventory />)
    const search = screen.getByPlaceholderText('Fragments, equipment...')

    fireEvent.change(search, { target: { value: 'item-that-does-not-exist' } })

    expect(await screen.findByText('No matching items')).toBeTruthy()
    expect(screen.queryByText('Fire Fragment')).toBeNull()
    expect(screen.queryByRole('button', { name: /^Add$/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Remove$/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Add and equip$/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Set exact$/ })).toBeNull()

    fireEvent.change(search, { target: { value: '' } })

    expect(await screen.findByText('Fire Fragment')).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Add$/ })).toBeTruthy()
  })

  it('keeps transmutation and boss-drop source filters distinct for signature equipment', async () => {
    render(<DeveloperInventory />)

    fireEvent.click(screen.getByRole('tab', { name: 'TRANSMUTATION' }))
    expect(await screen.findByText('Heartseed Necklace')).toBeTruthy()
    expect(screen.getByText('Greatbear Heartstone')).toBeTruthy()
    expect(screen.getByText("Edrin's Signet")).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: 'BOSS DROPS' }))
    expect(await screen.findByText('Heartseed')).toBeTruthy()
    expect(screen.queryByText('Heartseed Necklace')).toBeNull()
    expect(screen.queryByText('Greatbear Heartstone')).toBeNull()
    expect(screen.queryByText("Edrin's Signet")).toBeNull()
  })
})
