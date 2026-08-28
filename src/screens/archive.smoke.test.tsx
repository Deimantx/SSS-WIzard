import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GameShell } from '../app/GameShell'
import { useGameStore } from '../store/gameStore'
import { resetAllUiPreferences } from '../ui/preferences/uiPreferencesStore'

vi.mock('../components/ArcaneAtmosphere', () => ({ ArcaneAtmosphere: () => null }))

const navItem = (label: string) => within(screen.getByRole('navigation', { name: 'Main navigation' })).getAllByRole('button', { name: label }).find((button) => button.classList.contains('nav-item'))!
const mojibakePattern = new RegExp(['\\u00c3\\u00a2', '\\u00c3\\u201a', '\\u00c3\\u0192', '\\u00ef\\u00bf\\u00bd'].join('|'))

describe('archive screens', () => {
  beforeEach(() => { window.localStorage.clear(); useGameStore.getState().resetSave(); resetAllUiPreferences() })

  it('keeps undiscovered collection details redacted', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await user.click(navItem('Collection'))
    expect(screen.getByRole('heading', { name: 'ITEM COLLECTION' })).toBeTruthy()
    expect(screen.getByRole('tablist', { name: 'Collection discovery status' })).toBeTruthy()
    expect(screen.queryByText('Fire Fragment')).toBeNull()
    await user.click(screen.getAllByRole('button', { name: 'Undiscovered item' })[0])
    expect(screen.getByText('UNDISCOVERED ITEM')).toBeTruthy()
    expect(screen.queryByText('Fire Fragment')).toBeNull()
  })

  it('shows bestiary filters and reveals the dossier only after encounter', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await user.click(navItem('Bestiary'))
    expect(screen.getByRole('heading', { name: 'BESTIARY INDEX' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'MONSTERS' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'BOSSES' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'SPECIAL BOSSES' })).toBeTruthy()
    await user.click(screen.getAllByRole('button', { name: 'Undiscovered creature' })[0])
    expect(screen.getByText('UNDISCOVERED CREATURE')).toBeTruthy()
    expect(screen.queryByText('Forest Wisp')).toBeNull()

    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, discoveredMonsters: ['forest-wisp'] } })
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Forest Wisp' })).toBeTruthy())
    const discoveredEntry = screen.getByRole('button', { name: 'Forest Wisp, Monster, 0 defeats' })
    expect(discoveredEntry.textContent).not.toMatch(mojibakePattern)
    expect(screen.getByText('COMBAT STATS')).toBeTruthy()
    expect(screen.getByText('TRAITS')).toBeTruthy()
    expect(screen.getByText('SPECIAL ATTACKS')).toBeTruthy()
    expect(screen.getByText('ATTACK SEQUENCE')).toBeTruthy()
    expect(screen.getByText('LOOT TABLE')).toBeTruthy()
  })
})
