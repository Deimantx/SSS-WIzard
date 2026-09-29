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
  beforeEach(() => { window.localStorage.clear(); useGameStore.getState().resetSave(); useGameStore.setState((state) => { state.progress.startingSchoolId = 'fire'; state.progress.tutorialStage = 'complete'; state.ui.screen = 'home'; state.combat.active = false }); resetAllUiPreferences() })

  it('keeps undiscovered collection details redacted', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    useGameStore.setState((state) => { state.progress.guildUnlocked = true; state.progress.discoveredItems = [] })
    await user.click(navItem('Arcane Guild'))
    await user.click(screen.getByRole('button', { name: 'Registry' }))
    expect(screen.getByText('ARCANE REGISTRY')).toBeTruthy()
    expect(screen.queryByText('Fire Fragment')).toBeNull()
    useGameStore.setState((state) => { state.progress.discoveredItems = ['fire-fragment'] })
    await waitFor(() => expect(screen.getByRole('button', { name: /Fire Fragment/ })).toBeTruthy())
  })

  it('shows Hunter quarry filters and reveals the dossier only after encounter', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    useGameStore.getState().debugSetHuntersOrderUnlocked(true)
    const progressionGroup = screen.getByRole('button', { name: 'Toggle Progression group' })
    if (progressionGroup.getAttribute('aria-expanded') === 'false') await user.click(progressionGroup)
    await user.click(await screen.findByRole('button', { name: 'Hunter’s Order' }))
    await user.click(screen.getByRole('tab', { name: 'Bestiary' }))
    expect(screen.getByRole('heading', { name: 'QUARRY INDEX' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'HUNTER QUARRY' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'BOSSES' })).toBeTruthy()
    await user.click(screen.getAllByRole('button', { name: /Unknown Quarry/ })[0])
    expect(screen.getByText('UNKNOWN QUARRY')).toBeTruthy()
    expect(screen.queryByText('Forest Wisp')).toBeNull()

    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, discoveredMonsters: ['forest-wisp'] } })
    const discoveredEntry = await screen.findByRole('button', { name: /Forest Wisp/ })
    await user.click(discoveredEntry)
    expect(screen.getByRole('heading', { name: 'Forest Wisp' })).toBeTruthy()
    expect(discoveredEntry.textContent).not.toMatch(mojibakePattern)
    expect(screen.getByText('CLASSIFICATION')).toBeTruthy()
    const dossierTransition = document.querySelector('[data-inspector-identity="forest-wisp"]')
    expect(dossierTransition?.classList.contains('fill-bounded')).toBe(true)
    expect(dossierTransition?.querySelector('.hunter-dossier-content')?.classList.contains('smart-scroll-region')).toBe(true)
  })
})
