import { fireEvent, render, screen, within } from '@testing-library/react'
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

  it('keeps Transmutation material and boss-drop source filters distinct', async () => {
    render(<DeveloperInventory />)

    fireEvent.click(screen.getByRole('tab', { name: 'TRANSMUTATION' }))
    expect((await screen.findAllByText('Fire Fragment')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Prismatic Fragment').length).toBeGreaterThan(0)
    const browser = screen.getByRole('listbox', { name: 'Developer content browser' })
    expect(within(browser).queryByText('Ember Staff')).toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: 'BOSS DROPS' }))
    expect(screen.queryByText('Artifact Essence')).toBeNull()
    expect(screen.queryByText('Life Essence')).toBeNull()
    expect(within(browser).queryByText('Fire Fragment')).toBeNull()
    expect(within(browser).queryByText('Prismatic Fragment')).toBeNull()
  })
})
