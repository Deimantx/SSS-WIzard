import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScreenErrorBoundary } from '../components/errors/ScreenErrorBoundary'
import { GameShell } from '../app/GameShell'
import { resetAllUiPreferences, setUiPreferences } from '../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../store/gameStore'

vi.mock('../components/ArcaneAtmosphere', () => ({ ArcaneAtmosphere: () => null }))

const nav = () => within(screen.getByRole('navigation', { name: 'Main navigation' }))
const navItem = (label: string) => nav().getAllByRole('button', { name: label }).find((button) => button.classList.contains('nav-item'))!
const navGroup = (label: string) => nav().getByRole('button', { name: `Toggle ${label} group` })
const goToTower = async (user: ReturnType<typeof userEvent.setup>, label: string) => { const group = navGroup('Wizard Tower'); if (group.getAttribute('aria-expanded') === 'false') await user.click(group); await user.click(navItem(label)) }

describe('screen smoke coverage', () => {
  beforeEach(() => { window.localStorage.clear(); useGameStore.getState().resetSave(); resetAllUiPreferences() })

  it('renders each Wizard Tower system as its own focused screen', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    for (const item of [{ label: 'Channeling', heading: 'Channeling Chamber' }, { label: 'Focus', heading: 'Focus governs every parallel action.' }, { label: 'Transmutation', heading: 'Turn Mana and materials into matter.' }, { label: 'Research', heading: 'Research turns fragments into understanding.' }]) { await goToTower(user, item.label); expect(screen.getByRole('heading', { name: item.heading })).toBeTruthy() }
  })

  it('opens and closes the Arcane Discoveries modal with three real cards and six placeholders', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await goToTower(user, 'Channeling')
    await user.click(screen.getByRole('button', { name: 'Arcane Discoveries 0/3' }))
    expect(screen.getByRole('dialog', { name: 'Arcane Discoveries' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Stable Leyline' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Echo Resonance' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Deep Reservoir' })).toBeTruthy()
    expect(screen.getAllByText('Undiscovered')).toHaveLength(6)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Arcane Discoveries' })).toBeNull()
  })

  it('renders the five available Pillars and the item-only archive', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await goToTower(user, 'Channeling')
    expect(screen.getByRole('heading', { name: 'Pillars of Mana' })).toBeTruthy()
    for (const name of ['Leyline Conduit', 'Arcane Reservoir', 'Mana Resonance', 'Astral Expansion', 'Echo Attunement']) expect(screen.getByText(name, { selector: 'h3' })).toBeTruthy()
    await user.click(navItem('Collection'))
    expect(screen.getByRole('heading', { name: 'ITEM COLLECTION' })).toBeTruthy()
    expect(screen.getByText('Apprentice Wand')).toBeTruthy()
    expect(screen.queryByText('Forest Wisp')).toBeNull()
  })

  it('keeps Channeling readable by collapsing formulas and grouping Pillars', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await goToTower(user, 'Channeling')
    expect(screen.getByRole('heading', { name: 'Foundation Pillars' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Amplification Pillars' })).toBeTruthy()
    expect(screen.getByText('AVAILABLE MATERIALS')).toBeTruthy()
    expect(screen.queryByText('Base Echo Output')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'View Detailed Breakdown' }))
    expect(screen.getByText('Base Echo Output')).toBeTruthy()
  })

  it('navigates every major screen through grouped shell navigation', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    const screens = [{ nav: 'Overview', heading: 'Good evening, apprentice.' }, { nav: 'Combat', heading: 'The clearing watches back.' }, { nav: 'Magic Schools', heading: 'Four paths, one Focus pool.' }, { nav: 'Inventory', heading: 'Everything the tower currently holds.' }, { nav: 'Equipment', heading: 'Build the tower’s answer.' }, { nav: 'Guild', heading: 'A guild invitation, still sealed.' }, { nav: 'Collection', heading: 'Every relic leaves a record.' }, { nav: 'Bestiary', heading: 'Know what waits beyond the tower.' }, { nav: 'Settings / Info', heading: 'Settings / Info' }]
    for (const item of screens) { await user.click(navItem(item.nav)); expect(screen.getByRole('heading', { name: item.heading })).toBeTruthy() }
    expect(navGroup('Combat')).toBeTruthy()
    expect(navGroup('Hero')).toBeTruthy()
    expect(navGroup('Wizard Tower')).toBeTruthy()
    expect(navGroup('World')).toBeTruthy()
    expect(navGroup('System')).toBeTruthy()
  })

  it('keeps the shell mounted when a screen throws', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function BrokenScreen(): never { throw new Error('intentional screen failure') }
    render(<div><aside data-testid="shell-sidebar">Sidebar</aside><ScreenErrorBoundary screen="tower-channeling"><BrokenScreen /></ScreenErrorBoundary></div>)
    expect(screen.getByTestId('shell-sidebar')).toBeTruthy()
    expect(screen.getByText('This screen failed to render.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Return Home' })).toBeTruthy()
    error.mockRestore()
  })

  it('opens the desktop editor, follows navigation, and exits with Escape or drawer controls', async () => {
    const user = userEvent.setup()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 })
    render(<GameShell />)
    await user.click(screen.getByRole('button', { name: 'Edit UI' }))
    expect(screen.getByRole('complementary', { name: 'UI layout editor' })).toBeTruthy()
    await goToTower(user, 'Channeling')
    expect(screen.getAllByText('Channeling').length).toBeGreaterThan(0)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('complementary', { name: 'UI layout editor' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Edit UI' }))
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('complementary', { name: 'UI layout editor' })).toBeNull()
  })

  it('opens the Developer Console without changing the gameplay screen', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await user.click(screen.getByRole('button', { name: 'Dev Tools' }))
    expect(screen.getByRole('dialog', { name: 'Developer Tools' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Player' }))
    expect(screen.getByRole('heading', { name: 'Player values' })).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Developer Tools' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Good evening, apprentice.' })).toBeTruthy()
  })

  it('collapses a navigation group and reopens it when its screen becomes active', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    const towerHeader = navGroup('Wizard Tower')
    await user.click(towerHeader)
    expect(nav().queryByRole('button', { name: 'Channeling' })).toBeNull()
    useGameStore.getState().setScreen('tower-research')
    expect(await nav().findByRole('button', { name: 'Research' })).toBeTruthy()
  })

  it.each(['default', 'dark', 'light', 'custom'] as const)('renders %s appearance on Settings', async (theme) => {
    const user = userEvent.setup()
    render(<GameShell />)
    await user.click(navItem('Settings / Info'))
    const themeButton = screen.getAllByRole('button', { name: new RegExp(`^${theme === 'default' ? 'Default' : theme[0].toUpperCase() + theme.slice(1)}`) })[0]
    await user.click(themeButton)
    expect(screen.getByRole('heading', { name: 'Settings / Info' })).toBeTruthy()
    expect(document.documentElement.dataset.theme).toBe(theme)
    expect(screen.getByText('UI Sandbox')).toBeTruthy()
  })

  it('renders all primary surfaces under a custom theme', async () => {
    const user = userEvent.setup()
    setUiPreferences({ theme: 'custom' })
    render(<GameShell />)
    expect(screen.getByRole('heading', { name: 'Good evening, apprentice.' })).toBeTruthy()
    await goToTower(user, 'Research')
    expect(screen.getByRole('heading', { name: 'Research turns fragments into understanding.' })).toBeTruthy()
    await user.click(navItem('Combat'))
    expect(screen.getByRole('heading', { name: 'The clearing watches back.' })).toBeTruthy()
  })

  it('shows shared School Mastery and Current Arcane Work on Overview', () => {
    render(<GameShell />)
    expect(screen.getByRole('heading', { name: 'MAGIC SCHOOL MASTERY' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'CURRENT ARCANE WORK' })).toBeTruthy()
    for (const school of ['Fire', 'Water', 'Earth', 'Air']) expect(screen.getByText(school, { selector: 'strong' })).toBeTruthy()
    expect(screen.getAllByText('No Echoes assigned').length).toBeGreaterThan(0)
    expect(screen.getByText('No active recipes')).toBeTruthy()
  })
})
