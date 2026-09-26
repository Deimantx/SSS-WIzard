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
const goToMagicSchools = async (user: ReturnType<typeof userEvent.setup>) => { await user.click(navItem('Magic Schools')); await user.click(screen.getByRole('tab', { name: /FIRE/ })) }

describe('screen smoke coverage', () => {
  beforeEach(() => { window.localStorage.clear(); useGameStore.getState().resetSave(); useGameStore.setState((state) => { state.progress.startingSchoolId = 'fire'; state.progress.tutorialStage = 'complete'; state.ui.screen = 'home'; state.combat.active = false }); resetAllUiPreferences() })

  it('renders each Wizard Tower system as its own focused screen', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    const screenScroll = document.querySelector('.screen-scroll')
    expect(screenScroll).toBeTruthy()
    expect(screenScroll?.firstElementChild?.classList.contains('game-screen-transition')).toBe(true)
    expect(screenScroll?.querySelector('.screen-content')).toBeTruthy()
    for (const item of [{ label: 'Channeling', heading: 'Channeling Chamber' }, { label: 'Acolytes', heading: 'Tower Acolytes' }, { label: 'Transmutation', heading: 'Shape Resonance into elemental matter.' }, { label: 'Research', heading: 'Research turns fragments into understanding.' }]) { await goToTower(user, item.label); expect(screen.getByRole('heading', { name: item.heading })).toBeTruthy() }
  })

  it('opens and closes the Arcane Discoveries modal with three real cards and six placeholders', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await goToTower(user, 'Channeling')
    await user.click(screen.getByRole('button', { name: 'Arcane Discoveries 0/3' }))
    expect(screen.getByRole('dialog', { name: 'Arcane Discoveries' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Stable Leyline' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Harmonic Workforce' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Deep Reservoir' })).toBeTruthy()
    expect(screen.getAllByText('Undiscovered')).toHaveLength(6)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Arcane Discoveries' })).toBeNull()
  })

  it('renders the five available Pillars and the item-only archive', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await goToTower(user, 'Channeling')
    expect(screen.getByRole('heading', { name: 'LEYLINE PILLARS' })).toBeTruthy()
    for (const name of ['Leyline Conduit', 'Arcane Reservoir', 'Flux Resonance', 'Astral Expansion', 'Acolyte Attunement']) expect(screen.getByRole('button', { name: new RegExp(name) })).toBeTruthy()
    await user.click(navItem('Collection'))
    expect(screen.getByRole('heading', { name: 'ITEM COLLECTION' })).toBeTruthy()
    expect(screen.queryByText('Apprentice Wand')).toBeNull()
    expect(screen.queryByText('Forest Wisp')).toBeNull()
  })

  it('keeps Channeling readable with a persistent breakdown and grouped Pillars', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await goToTower(user, 'Channeling')
    expect(screen.getByRole('heading', { name: 'LEYLINE PILLARS' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'CHANNELING BREAKDOWN' })).toBeTruthy()
    expect(screen.getAllByText('PRODUCTION').length).toBeGreaterThan(0)
    expect(screen.getByText('Base / Acolyte')).toBeTruthy()
    expect(screen.getByText('FINAL PRODUCTION')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'View Detailed Breakdown' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'View Acolyte Modifiers' })).toBeNull()
  })

  it('navigates every major screen through grouped shell navigation', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    expect(screen.getByText('Complete First Frontier')).toBeTruthy()
    expect(screen.queryByText(/first three dungeons/i)).toBeNull()
    const screens = [{ nav: 'Overview', heading: 'Good evening, apprentice.' }, { nav: 'Combat', heading: 'Combat' }, { nav: 'Magic Schools', heading: 'Magic Schools' }, { nav: 'Inventory', heading: 'Everything the tower currently holds.' }, { nav: 'Equipment', heading: 'Build the tower’s answer.' }, { nav: 'Arcane Core', heading: 'Arcane Core' }, { nav: 'Guild', heading: 'A guild invitation, still sealed.' }, { nav: 'Collection', heading: 'Every relic leaves a record.' }, { nav: 'Bestiary', heading: 'Know what waits beyond the tower.' }, { nav: 'Settings / Info', heading: 'Settings / Info' }]
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

  it('opens and closes an Arcane Core branch without leaving an orphan modal', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await user.click(navItem('Arcane Core'))
    expect(screen.getByRole('heading', { name: 'Arcane Core' })).toBeTruthy()
    expect(screen.queryByText('This screen failed to render.')).toBeNull()

    await user.click(screen.getByRole('button', { name: /POWER CORE/i }))
    expect(screen.getByRole('dialog', { name: 'Power Core' })).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Power Core' })).toBeNull()

    await user.click(navItem('Overview'))
    expect(document.querySelector('.arcane-core-modal')).toBeNull()
    expect(document.querySelector('.modal-portal-backdrop')).toBeNull()
  })

  it('opens the Developer Console without changing the gameplay screen', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await user.click(screen.getByRole('button', { name: 'Dev Tools' }))
    expect(screen.getByRole('dialog', { name: 'Developer Tools' })).toBeTruthy()
    await user.click(within(screen.getByRole('navigation', { name: 'Developer tool sections' })).getByRole('button', { name: 'Spells & Schools' }))
    await user.click(screen.getByRole('tab', { name: 'SCHOOLS' }))
    expect(screen.getByRole('heading', { name: 'Magic schools' })).toBeTruthy()
    for (const label of ['Set all to Level 2', 'Set all to Level 8', 'Set all to Level 16', 'Set all to Level 20', 'Set cap to 20', 'Set cap to 40', 'Unlock all Rank-I spells', 'Reset spell cooldowns']) expect(screen.getByRole('button', { name: label })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Unlock Rank I' })).toHaveLength(32)
    await user.click(screen.getByRole('button', { name: 'Character' }))
    expect(screen.getByRole('heading', { name: 'Player values' })).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog', { name: 'Developer Tools' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Close Developer Tools' }))
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
    expect(screen.getByRole('heading', { name: 'Combat' })).toBeTruthy()
  })

  it('shows shared School Mastery and Current Arcane Work on Overview', () => {
    render(<GameShell />)
    expect(screen.getByRole('heading', { name: 'MAGIC SCHOOL MASTERY' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'CURRENT TOWER WORK' })).toBeTruthy()
    for (const school of ['Fire', 'Water', 'Earth', 'Air']) expect(screen.getByText(school, { selector: 'strong' })).toBeTruthy()
    expect(screen.getAllByText('No Acolytes assigned').length).toBeGreaterThan(0)
    expect(screen.getByText('No active recipes')).toBeTruthy()
  })

  it('renders the fresh spellbook state with independent Auto-Cast', async () => {
    const user = userEvent.setup()
    render(<GameShell />)

    await goToMagicSchools(user)
    expect(screen.getByRole('heading', { name: 'Magic Schools' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Search spells' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Spell Library' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Combat Loadout' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Fire Bolt' })).toBeTruthy()

    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1, 'water-bolt': 1 } } })
    await user.click(navItem('Combat'))
    await goToMagicSchools(user)
    expect(screen.getByText('Fire Bolt', { selector: 'strong' })).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: /WATER/ }))
    expect(screen.getByText('Water Bolt', { selector: 'strong' })).toBeTruthy()
    expect(screen.queryAllByText('???')).toHaveLength(0)
    await user.click(screen.getByRole('tab', { name: /FIRE/ }))
    const fireBoltTile = screen.getByRole('button', { name: /Fire Bolt,/ })
    await user.click(fireBoltTile)
    const spellInspectorScroll = document.querySelector('.schools-inspector-panel .spell-inspector-scroll')
    expect(spellInspectorScroll?.classList.contains('smart-scroll-region')).toBe(true)
    expect(screen.getByText(/Auto-Cast/)).toBeTruthy()
    expect(screen.queryByText('Current Rank')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Auto-Cast OFF' })).toBeNull()
    expect(screen.queryByText('10 Focus reserved')).toBeNull()
    await user.click(screen.getByRole('tab', { name: /WATER/ }))
    await user.click(screen.getByRole('button', { name: /Water Bolt,/ }))
    expect(screen.getByRole('heading', { name: 'Water Bolt' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Water Bolt,/ }).getAttribute('aria-pressed')).toBe('true')
  })

  it('keeps runtime Auto-Cast configuration out of the spell inspector', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1 } } })
    render(<GameShell />)
    await goToMagicSchools(user)
    await user.click(screen.getByRole('button', { name: /Fire Bolt,/ }))
    expect(screen.getByText('Auto-Cast')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Auto-Cast (ON|OFF)/ })).toBeNull()
    expect(screen.queryByText('Always')).toBeNull()
    expect(screen.queryByText('Focus reserved')).toBeNull()
  })

  it('exposes rich effect tooltips from the selected spell inspector', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'searing-touch': 1 } } })
    render(<GameShell />)
    await goToMagicSchools(user)

    await user.click(screen.getByRole('button', { name: /Searing Touch,/ }))
    const effectRow = screen.getByLabelText('DOT: Burning')
    await user.hover(effectRow)
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip.textContent).toContain('Burning')
    expect(tooltip.textContent).toContain('Damage Per Tick')
    expect(tooltip.textContent).toContain('1.0s')
    expect(tooltip.textContent).toContain('Alt')
    await user.keyboard('{Alt>}')
    await waitFor(() => expect(screen.getByRole('tooltip').textContent).toContain('Source'))
    effectRow.focus()
    await user.keyboard('{/Alt}')
    await waitFor(() => expect(screen.getByRole('tooltip').textContent).toContain('Burning'))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('shows the selected spell inspector and prioritized details inline', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    const equipment = useGameStore.getState().equipment
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1, harden: 1, 'frost-touch': 1 } }, equipment: { ...equipment, weapon: 'ember-staff' } })
    render(<GameShell />)
    await goToMagicSchools(user)

    const fireBoltTile = screen.getByRole('button', { name: /Fire Bolt,/ })
    await user.click(fireBoltTile)
    expect(screen.getByRole('heading', { name: 'Fire Bolt' })).toBeTruthy()
    expect(screen.getByText('Base Damage')).toBeTruthy()
    expect(screen.getByText('75% Spell Power')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: /EARTH/ }))
    await user.click(screen.getByRole('button', { name: /Harden,/ }))
    const fortifyRow = screen.getByLabelText('BUFF: Hardened')
    expect(fortifyRow.textContent).toContain('Damage Taken')
    expect(fortifyRow.textContent).toContain('-25%')
    expect(fortifyRow.textContent).toContain('Duration')
    expect(fortifyRow.textContent).toContain('5.0s')
    expect(fortifyRow.textContent).toContain('Target')
    expect(fortifyRow.textContent).toContain('Self')
    await user.hover(fortifyRow)
    await screen.findByRole('tooltip')
    await user.keyboard('{Alt>}')
    await waitFor(() => expect(screen.getByRole('tooltip').textContent).toContain('Source'))
    fortifyRow.focus()
    await user.keyboard('{/Alt}')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).toBeNull()

    await user.click(screen.getByRole('tab', { name: /WATER/ }))
    await user.click(screen.getByRole('button', { name: /Frost Touch,/ }))
    expect(screen.getByLabelText('DAMAGE: Water Damage')).toBeTruthy()
    expect(screen.getByLabelText('CONTROL: Chilled')).toBeTruthy()
  })

  it('shows locked spell requirements in the inspector', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1 } } })
    render(<GameShell />)
    await goToMagicSchools(user)
    const lockedTile = screen.getAllByRole('button', { name: /Locked Searing Touch/ })[0]
    await user.click(lockedTile)
    expect(screen.getByRole('heading', { name: 'Searing Touch' })).toBeTruthy()
    expect(screen.getByText('Current Fire Level')).toBeTruthy()
    expect(screen.getByText(/Requires Level 7/)).toBeTruthy()
  })

  it('clicking EQUIPPED removes the spell from the prepared loadout', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1 } } })
    render(<GameShell />)
    await goToMagicSchools(user)
    await user.click(screen.getByRole('button', { name: 'Equip Fire Bolt' }))
    expect(screen.getByRole('button', { name: 'Remove Fire Bolt from Combat Loadout' })).toBeTruthy()
    expect(screen.getByText('1 / 8 prepared')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Remove Fire Bolt from Combat Loadout' }))
    expect(screen.queryByRole('button', { name: 'Remove Fire Bolt from Combat Loadout' })).toBeNull()
    expect(screen.getByText('0 / 8 prepared')).toBeTruthy()
  })

  it('uses the themed Type menu for semantic spell filtering', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    const player = useGameStore.getState().player
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1, 'earthen-barrier': 1 } }, player })
    render(<GameShell />)
    await goToMagicSchools(user)
    expect(document.querySelector('.schools-browser-panel select')).toBeNull()
    await user.click(screen.getByRole('tab', { name: /EARTH/ }))
    await user.click(screen.getByRole('tab', { name: 'Defense' }))
    expect(screen.getByText('Earthen Barrier', { selector: 'strong' })).toBeTruthy()
    expect(screen.queryByText('Fire Bolt', { selector: 'strong' })).toBeNull()
  })

  it('dismisses the Rank Path rail from outside clicks and Escape', async () => {
    const user = userEvent.setup()
    const progress = useGameStore.getState().progress
    useGameStore.setState({ progress: { ...progress, spellRanks: { 'fire-bolt': 1 } } })
    render(<GameShell />)
    await goToMagicSchools(user)
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
  })
})
