import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScreenErrorBoundary } from '../components/errors/ScreenErrorBoundary'
import { GameShell } from '../app/GameShell'
import { resetAppearance, setUiPreferences } from '../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../store/gameStore'

vi.mock('../components/ArcaneAtmosphere', () => ({ ArcaneAtmosphere: () => null }))

describe('screen smoke coverage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
    resetAppearance()
  })

  it('renders Wizard Tower without an update loop', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await user.click(screen.getByRole('button', { name: /Wizard Tower/i }))
    expect(screen.getByRole('heading', { name: 'The tower is awake.' })).toBeTruthy()
  })

  it('navigates every major screen through the actual shell router', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    const screens = [{ nav: 'Overview', heading: 'Good evening, apprentice.' }, { nav: 'Wizard Tower', heading: 'The tower is awake.' }, { nav: 'Magic Schools', heading: 'Four paths, one Focus pool.' }, { nav: 'Combat', heading: 'The clearing watches back.' }, { nav: 'Inventory', heading: 'Everything the tower has earned.' }, { nav: 'Equipment', heading: 'Build the tower’s answer.' }, { nav: 'Guild', heading: 'A guild invitation, still sealed.' }, { nav: 'Collection', heading: 'Collection' }, { nav: 'Settings / Info', heading: 'Settings / Info' }]
    for (const item of screens) {
      await user.click(within(screen.getByRole('navigation')).getByRole('button', { name: item.nav }))
      expect(screen.getByRole('heading', { name: item.heading })).toBeTruthy()
    }
  })

  it('keeps the shell mounted when a screen throws', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function BrokenScreen(): never { throw new Error('intentional screen failure') }
    render(<div><aside data-testid="shell-sidebar">Sidebar</aside><ScreenErrorBoundary screen="tower"><BrokenScreen /></ScreenErrorBoundary></div>)
    expect(screen.getByTestId('shell-sidebar')).toBeTruthy()
    expect(screen.getByText('This screen failed to render.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Return Home' })).toBeTruthy()
    error.mockRestore()
  })

  it.each(['default', 'dark', 'light', 'custom'] as const)('renders %s appearance on Settings', async (theme) => {
    const user = userEvent.setup()
    render(<GameShell />)
    await user.click(screen.getByRole('button', { name: 'Settings / Info' }))
    const themeButton = screen.getAllByRole('button', { name: new RegExp(`^${theme === 'default' ? 'Default' : theme[0].toUpperCase() + theme.slice(1)}`) })[0]
    await user.click(themeButton)
    expect(screen.getByRole('heading', { name: 'Settings / Info' })).toBeTruthy()
    expect(document.documentElement.dataset.theme).toBe(theme)
  })

  it.each(['default', 'dark', 'light', 'custom'] as const)('renders Home, Tower, Combat, and Settings under %s', async (theme) => {
    const user = userEvent.setup()
    setUiPreferences({ theme })
    render(<GameShell />)
    for (const item of [{ nav: 'Overview', heading: 'Good evening, apprentice.' }, { nav: 'Wizard Tower', heading: 'The tower is awake.' }, { nav: 'Combat', heading: 'The clearing watches back.' }, { nav: 'Settings / Info', heading: 'Settings / Info' }]) {
      await user.click(within(screen.getByRole('navigation')).getByRole('button', { name: item.nav }))
      expect(screen.getByRole('heading', { name: item.heading })).toBeTruthy()
    }
  })
})
