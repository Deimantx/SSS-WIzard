import { render, screen, waitFor, within } from '@testing-library/react'
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
    const screens = [{ nav: 'Overview', heading: 'Good evening, apprentice.' }, { nav: 'Combat', heading: 'The dungeon watches back.' }, { nav: 'Magic Schools', heading: 'Magic Schools' }, { nav: 'Inventory', heading: 'Everything the tower currently holds.' }, { nav: 'Equipment', heading: 'Build the tower’s answer.' }, { nav: 'Guild', heading: 'A guild invitation, still sealed.' }, { nav: 'Collection', heading: 'Every relic leaves a record.' }, { nav: 'Bestiary', heading: 'Know what waits beyond the tower.' }, { nav: 'Settings / Info', heading: 'Settings / Info' }]
    for (const item of screens) { await user.click(navItem(item.nav)); expect(screen.getByRole('heading', { name: item.heading })).toBeTruthy() }
    expect(navGroup('Combat')).toBeTruthy()
    expect(navGroup('Hero')).toBeTruthy()
    expect(navGroup('Wizard Tower')).toBeTruthy()
    expect(navGroup('World')).toBeTruthy()
    expect(navGroup('System')).toBeTruthy()
  }, 10_000)

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
  }, 10_000)

  it('opens the Developer Console without changing the gameplay screen', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await user.click(screen.getByRole('button', { name: 'Dev Tools' }))
    expect(screen.getByRole('dialog', { name: 'Developer Tools' })).toBeTruthy()
    await user.click(within(screen.getByRole('navigation', { name: 'Developer tool sections' })).getByRole('button', { name: 'Magic Schools' }))
    expect(screen.getByRole('heading', { name: 'Magic schools' })).toBeTruthy()
    for (const label of ['Set all Lv2', 'Set all Lv8', 'Set all Lv16', 'Set all Lv20', 'Set all Lv40', 'Unlock all Rank I spells', 'Reset spell cooldowns']) expect(screen.getByRole('button', { name: label })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Unlock Rank I' })).toHaveLength(12)
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
    expect(screen.getByRole('heading', { name: 'The dungeon watches back.' })).toBeTruthy()
  })

  it('shows shared School Mastery and Current Arcane Work on Overview', () => {
    render(<GameShell />)
    expect(screen.getByRole('heading', { name: 'MAGIC SCHOOL MASTERY' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'CURRENT ARCANE WORK' })).toBeTruthy()
    for (const school of ['Fire', 'Water', 'Earth', 'Air']) expect(screen.getByText(school, { selector: 'strong' })).toBeTruthy()
    expect(screen.getAllByText('No Echoes assigned').length).toBeGreaterThan(0)
    expect(screen.getByText('No active recipes')).toBeTruthy()
  })

  it('renders the fresh spellbook state and canonical spell Focus costs', async () => {
    const user = userEvent.setup()
    render(<GameShell />)

    await user.click(navItem('Magic Schools'))
    expect(screen.getByRole('heading', { name: 'Magic Schools' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Search Spells' })).toBeTruthy()
    expect(screen.queryByText('Fire Bolt')).toBeNull()
    expect((screen.getByRole('checkbox', { name: 'Unlocked Only' }) as HTMLInputElement).checked).toBe(true)
    expect(screen.getByText('NO SPELLS LEARNED YET')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'SELECT A SPELL' })).toBeTruthy()
    expect(screen.queryByText(/EDRIN|CAP|Next Lv/)).toBeNull()

    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1, 'water-ward': 1 } } })
    await user.click(navItem('Combat'))
    await user.click(navItem('Magic Schools'))
    expect(screen.getByText('Fire Bolt', { selector: 'strong' })).toBeTruthy()
    expect(screen.getByText('Water Ward', { selector: 'strong' })).toBeTruthy()
    expect(screen.queryAllByText('???')).toHaveLength(0)
    const fireBoltTile = screen.getByRole('button', { name: /Fire Bolt,/ })
    expect(fireBoltTile.querySelector('.spell-browser-rank-badge')).toBeNull()
    expect(fireBoltTile.querySelector('.spell-tile-status')).toBeNull()
    await user.click(fireBoltTile)
    expect(screen.getByText(/Auto-Cast Focus/)).toBeTruthy()
    expect(screen.queryByText('Current Rank')).toBeNull()
    expect(screen.getByRole('button', { name: 'Auto-Cast OFF' })).toBeTruthy()
    expect(screen.getByText('10 Focus when enabled')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Auto-Cast OFF' }))
    expect(screen.getByRole('button', { name: 'Auto-Cast ON' })).toBeTruthy()
    expect(screen.getByText('10 Focus reserved')).toBeTruthy()
    expect(fireBoltTile.querySelector('.spell-tile-status')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Water Ward,/ }))
    expect(screen.getByRole('heading', { name: 'Water Ward' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Water Ward,/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: /Fire Bolt,/ }).getAttribute('aria-pressed')).toBe('false')
    await user.click(navItem('Combat'))
    await user.click(navItem('Magic Schools'))
    await user.click(screen.getByRole('checkbox', { name: 'Unlocked Only' }))
    expect(screen.getAllByText('???').length).toBeGreaterThan(0)
  })

  it('shows a themed insufficient-Focus Auto-Cast state without enabling it', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    const player = useGameStore.getState().player
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1 } }, player: { ...player, maxFocus: 0 } })
    render(<GameShell />)
    await user.click(navItem('Magic Schools'))
    await user.click(screen.getByRole('button', { name: /Fire Bolt,/ }))
    const toggle = screen.getByRole('button', { name: 'Auto-Cast OFF' })
    expect(toggle.hasAttribute('disabled')).toBe(true)
    expect(screen.getByText('Need 10 Focus')).toBeTruthy()
  })

  it('derives effect micro-icons and exposes rich mouse and keyboard effect tooltips', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, spellRanks: { ignite: 1 } } })
    render(<GameShell />)
    await user.click(navItem('Magic Schools'))

    const igniteTile = screen.getByRole('button', { name: /Ignite,/ })
    const tileShell = igniteTile.closest('.spell-browser-tile-shell')!
    const microIcons = tileShell.querySelectorAll('.spell-browser-effect-icon')
    expect(microIcons).toHaveLength(2)
    expect(microIcons[0].getAttribute('aria-label')).toBe('Damage')
    expect(microIcons[1].getAttribute('aria-label')).toBe('DoT')
    await user.hover(microIcons[1])
    expect((await screen.findByRole('tooltip')).textContent).toContain('DoT')
    await user.unhover(microIcons[1])
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())

    await user.click(igniteTile)
    const effectRow = screen.getByLabelText('DOT: Burning')
    await user.hover(effectRow)
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip.textContent).toContain('Burning')
    expect(tooltip.textContent).toContain('Damage Per Tick')
    expect(tooltip.textContent).toContain('1.0s')
    expect(tooltip.textContent).toContain('Source')
    effectRow.focus()
    await waitFor(() => expect(screen.getByRole('tooltip').textContent).toContain('Burning'))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('creates, saves, and applies an Auto-Cast preset from the Schools screen', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1 } } })
    render(<GameShell />)
    await user.click(navItem('Magic Schools'))
    await user.click(screen.getByRole('button', { name: 'MANAGE PRESETS' }))
    const dialog = screen.getByRole('dialog', { name: 'SPELL PRESET MANAGER' })
    expect(within(dialog).getByText('FIRE · RANK I')).toBeTruthy()
    await user.clear(within(dialog).getByRole('textbox', { name: 'Preset name' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Preset name' }), 'Fire opener')
    await user.click(within(dialog).getByRole('button', { name: /Fire Bolt/ }))
    await user.click(within(dialog).getByRole('button', { name: 'SAVE' }))
    await user.click(within(dialog).getByRole('button', { name: 'APPLY' }))
    expect(useGameStore.getState().spellPresets.presets[0]).toMatchObject({ name: 'Fire opener', spellIds: ['fire-bolt'] })
    expect(useGameStore.getState().spellPresets.lastAppliedPresetId).toBe('spell-preset-1')
    expect(useGameStore.getState().activities.autoCast['fire-bolt']).toBe(true)
  })

  it('opens a local first-use preset draft without persisting it', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await user.click(navItem('Magic Schools'))
    expect(screen.getByText('0 Spells · 0 Focus')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'MANAGE PRESETS' }))
    const dialog = screen.getByRole('dialog', { name: 'SPELL PRESET MANAGER' })
    expect(within(dialog).getByRole('heading', { name: 'AVAILABLE SPELLS' })).toBeTruthy()
    expect(within(dialog).getByRole('heading', { name: 'PRESET LOADOUT' })).toBeTruthy()
    expect(within(dialog).getByText('NO SPELLS IN THIS PRESET')).toBeTruthy()
    expect(within(dialog).getByText('FOCUS BUDGET')).toBeTruthy()
    await user.click(within(dialog).getByRole('button', { name: 'Close spell preset manager' }))
    expect(screen.queryByRole('dialog', { name: 'SPELL PRESET MANAGER' })).toBeNull()
    expect(useGameStore.getState().spellPresets.presets).toHaveLength(0)
  })

  it('keeps a dirty preset draft behind a themed discard confirmation', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1 } } })
    render(<GameShell />)
    await user.click(navItem('Magic Schools'))
    await user.click(screen.getByRole('button', { name: 'MANAGE PRESETS' }))
    const dialog = screen.getByRole('dialog', { name: 'SPELL PRESET MANAGER' })
    await user.clear(within(dialog).getByRole('textbox', { name: 'Preset name' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Preset name' }), 'Unsaved')
    await user.click(within(dialog).getByRole('button', { name: 'Close spell preset manager' }))
    expect(screen.getByRole('alertdialog', { name: 'DISCARD UNSAVED CHANGES?' })).toBeTruthy()
    expect(useGameStore.getState().spellPresets.presets).toHaveLength(0)
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'DISCARD' }))
    expect(screen.queryByRole('dialog', { name: 'SPELL PRESET MANAGER' })).toBeNull()
  })

  it('uses the themed Type menu and disables Apply when the projected Focus overflows', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    const player = useGameStore.getState().player
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1, 'water-ward': 1 } }, player: { ...player, maxFocus: 0 } })
    render(<GameShell />)
    await user.click(navItem('Magic Schools'))
    expect(document.querySelector('.schools-browser-panel select')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Spell type filter' }))
    await user.click(screen.getByRole('option', { name: 'Barrier' }))
    expect(screen.getByText('Water Ward', { selector: 'strong' })).toBeTruthy()
    expect(screen.queryByText('Fire Bolt', { selector: 'strong' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'MANAGE PRESETS' }))
    const dialog = screen.getByRole('dialog', { name: 'SPELL PRESET MANAGER' })
    await user.click(within(dialog).getByRole('button', { name: /Water Ward/ }))
    expect(within(dialog).getByText('Need 10 more Focus.')).toBeTruthy()
    expect(within(dialog).getByRole('button', { name: 'APPLY' }).hasAttribute('disabled')).toBe(true)
  })

  it('dismisses the Rank Path rail from outside clicks, Escape, and Preset Manager', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1 } } })
    render(<GameShell />)
    await user.click(navItem('Magic Schools'))
    await user.click(screen.getByRole('button', { name: /Fire Bolt,/ }))
    await user.click(screen.getByRole('button', { name: /VIEW RANK PATH/ }))
    const rail = screen.getByRole('complementary', { name: 'Spell rank path' })
    expect(rail).toBeTruthy()
    await user.click(within(rail).getByRole('heading', { name: 'Rank Path' }))
    expect(screen.getByRole('complementary', { name: 'Spell rank path' })).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('complementary', { name: 'Spell rank path' })).toBeNull()
    await user.click(screen.getByRole('button', { name: /VIEW RANK PATH/ }))
    await user.click(screen.getByText('EFFECTS', { selector: 'div' }))
    expect(screen.queryByRole('complementary', { name: 'Spell rank path' })).toBeNull()
    await user.click(screen.getByRole('button', { name: /VIEW RANK PATH/ }))
    await user.click(screen.getByRole('button', { name: 'Close rank path' }))
    expect(screen.queryByRole('complementary', { name: 'Spell rank path' })).toBeNull()
    await user.click(screen.getByRole('button', { name: /VIEW RANK PATH/ }))
    await user.click(screen.getByRole('button', { name: 'MANAGE PRESETS' }))
    expect(screen.queryByRole('complementary', { name: 'Spell rank path' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'SPELL PRESET MANAGER' })).toBeTruthy()
  })

  it('uses title mode for saved preset names and themed inline editing', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1 } } })
    render(<GameShell />)
    await user.click(navItem('Magic Schools'))
    await user.click(screen.getByRole('button', { name: 'MANAGE PRESETS' }))
    const dialog = screen.getByRole('dialog', { name: 'SPELL PRESET MANAGER' })
    await user.clear(within(dialog).getByRole('textbox', { name: 'Preset name' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Preset name' }), 'Themed Build')
    await user.click(within(dialog).getByRole('button', { name: /Fire Bolt/ }))
    await user.click(within(dialog).getByRole('button', { name: 'SAVE' }))
    await user.click(within(dialog).getByRole('button', { name: 'CANCEL' }))
    await user.click(screen.getByRole('button', { name: 'MANAGE PRESETS' }))
    const reopened = screen.getByRole('dialog', { name: 'SPELL PRESET MANAGER' })
    expect(within(reopened).queryByRole('textbox', { name: 'Preset name' })).toBeNull()
    await user.click(within(reopened).getByRole('button', { name: 'Edit preset name' }))
    const nameInput = within(reopened).getByRole('textbox', { name: 'Preset name' })
    await user.clear(nameInput)
    await user.type(nameInput, 'Renamed Build')
    await user.keyboard('{Enter}')
    expect(within(reopened).getByText('Renamed Build')).toBeTruthy()
  })
})
