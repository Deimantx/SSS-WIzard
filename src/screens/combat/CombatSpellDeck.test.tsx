import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { CombatSpellDeck } from './CombatSpellDeck'

describe('CombatSpellDeck V2', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
    const state = useGameStore.getState()
    useGameStore.setState({ progress: { ...state.progress, spellRanks: { ...state.progress.spellRanks, 'fire-bolt': 1 } } })
  })

  it('uses compact action tiles and switches a saved preset from the header', async () => {
    const user = userEvent.setup()
    const id = useGameStore.getState().createSpellPreset('Fire opener')
    useGameStore.getState().saveSpellPreset({ id, name: 'Fire opener', spellIds: ['fire-bolt'] })
    render(<TooltipProvider><CombatSpellDeck /></TooltipProvider>)

    expect(screen.getByText('Fire Bolt', { selector: 'strong' })).toBeTruthy()
    expect(screen.queryByText(/RANK I/)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Combat Auto-Cast preset' }))
    await user.click(screen.getByRole('option', { name: 'Fire opener' }))
    expect(useGameStore.getState().activities.autoCast['fire-bolt']).toBe(true)
    expect(screen.getByText('Fire opener', { selector: '.select-menu-label' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Disable Auto-Cast for Fire Bolt' }))
    expect(screen.getByText('CUSTOM', { selector: '.select-menu-label' })).toBeTruthy()
  })

  it('removes every active Auto-Cast assignment from the footer control', async () => {
    const user = userEvent.setup()
    const current = useGameStore.getState()
    useGameStore.setState({
      activities: { ...current.activities, autoCast: { ...current.activities.autoCast, 'fire-bolt': true, ignite: true } },
      combat: { ...current.combat, autoCastManaStarvedSpells: ['fire-bolt'] },
    })
    render(<TooltipProvider><CombatSpellDeck /></TooltipProvider>)

    const clearButton = screen.getByRole('button', { name: 'REMOVE ALL ECHOES' })
    expect((clearButton as HTMLButtonElement).disabled).toBe(false)
    await user.click(clearButton)

    expect(Object.values(useGameStore.getState().activities.autoCast).every((enabled) => !enabled)).toBe(true)
    expect(useGameStore.getState().combat.autoCastManaStarvedSpells).toEqual([])
    expect(screen.getByText(/0 Focus reserved/)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'REMOVE ALL ECHOES' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('keeps the live configuration unchanged when a preset exceeds Focus', async () => {
    const user = userEvent.setup()
    const current = useGameStore.getState()
    useGameStore.setState({ player: { ...current.player, maxFocus: 0 } })
    const id = useGameStore.getState().createSpellPreset('Too costly')
    useGameStore.getState().saveSpellPreset({ id, name: 'Too costly', spellIds: ['fire-bolt'] })
    render(<TooltipProvider><CombatSpellDeck /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: 'Combat Auto-Cast preset' }))
    await user.click(screen.getByRole('option', { name: 'Too costly' }))
    expect(useGameStore.getState().activities.autoCast['fire-bolt']).toBe(false)
    expect(screen.getByRole('alert').textContent).toContain('Only 0 Focus is available')
    expect(screen.getByText('CUSTOM', { selector: '.select-menu-label' })).toBeTruthy()
  })

  it('keeps the Auto-Cast control inside its spell tile in both states', async () => {
    const user = userEvent.setup()
    useGameStore.getState().preset('combat')
    render(<TooltipProvider><CombatSpellDeck /></TooltipProvider>)
    const autoButton = screen.getByRole('button', { name: 'Enable Auto-Cast for Fire Bolt' })
    expect(autoButton.closest('.spell-combat-auto-slot')?.parentElement?.classList.contains('spell-combat-tile')).toBe(true)

    await user.click(autoButton)
    const activeButton = screen.getByRole('button', { name: 'Disable Auto-Cast for Fire Bolt' })
    expect(activeButton.closest('.spell-combat-auto-slot')?.parentElement?.classList.contains('spell-combat-tile')).toBe(true)
    expect(activeButton.classList.contains('is-active')).toBe(true)
  })

  it('renders active preset Focus calculations with equipment context', () => {
    const current = useGameStore.getState()
    useGameStore.setState({
      progress: { ...current.progress, spellRanks: { ...current.progress.spellRanks, 'fire-bolt': 1 } },
      activities: { ...current.activities, autoCast: { ...current.activities.autoCast, 'fire-bolt': true } },
    })
    const id = useGameStore.getState().createSpellPreset('Fire focus')
    useGameStore.getState().saveSpellPreset({ id, name: 'Fire focus', spellIds: ['fire-bolt'] })

    render(<TooltipProvider><CombatSpellDeck /></TooltipProvider>)

    expect(screen.getByText('Fire focus', { selector: '.select-menu-label' })).toBeTruthy()
    expect(screen.getByText('10 Focus', { selector: '.ui-focus' })).toBeTruthy()
  })

  it('keeps cooldown presentation on the icon with a readable countdown', () => {
    const current = useGameStore.getState()
    useGameStore.setState({ combat: { ...current.combat, active: true, enemyId: 'forest-wisp', spellCooldowns: { ...current.combat.spellCooldowns, 'fire-bolt': 3400 } } })
    const { container } = render(<TooltipProvider><CombatSpellDeck /></TooltipProvider>)
    expect(container.querySelector('.spell-combat-cooldown-overlay')).toBeTruthy()
    expect(screen.getByText('3.4')).toBeTruthy()
    expect(container.querySelector('.spell-combat-footer .ui-time')?.textContent).toBe('1.0s')
    expect(container.querySelector('.spell-combat-cooldown-mask')).toBeNull()
  })

  it('formats mana deficits without exposing floating-point tails', () => {
    const current = useGameStore.getState()
    useGameStore.setState({
      player: { ...current.player, mana: -2.01300000011925 },
      combat: { ...current.combat, active: true, enemyId: 'forest-wisp' },
    })
    render(<TooltipProvider><CombatSpellDeck /></TooltipProvider>)

    expect(screen.getByText('Need 32')).toBeTruthy()
    expect(screen.queryByText(/0000000119/)).toBeNull()
  })

  it('shows the current cast and one-slot manual queue without disabling queued tiles', async () => {
    const user = userEvent.setup()
    const current = useGameStore.getState()
    useGameStore.setState({
      player: { ...current.player, mana: 100 },
      progress: { ...current.progress, spellRanks: { ...current.progress.spellRanks, 'fire-bolt': 1, 'wind-blade': 1 } },
      activities: { ...current.activities, autoCast: { ...current.activities.autoCast, 'fire-bolt': true }, autoCastPriority: ['fire-bolt'] },
      combat: { ...current.combat, active: true, dungeonId: 'whispering-woods', enemyId: 'forest-wisp', enemyInstanceKey: 'enemy:1', enemyHp: 100_000, enemyMaxHp: 100_000, spellCooldowns: { ...current.combat.spellCooldowns, 'wind-blade': 2400 } },
    })
    expect(useGameStore.getState().requestManualSpell('fire-bolt')).toMatchObject({ ok: true, action: 'started' })

    const { container } = render(<TooltipProvider><CombatSpellDeck /></TooltipProvider>)
    const fireTile = container.querySelector('[data-spell-id="fire-bolt"]') as HTMLElement
    const windTile = container.querySelector('[data-spell-id="wind-blade"]') as HTMLElement
    expect(fireTile.classList.contains('is-current-cast')).toBe(true)
    expect(fireTile.textContent).toContain('CASTING')
    expect(fireTile.textContent).toContain('P1')

    const windCastButton = windTile.querySelector('.spell-combat-cast') as HTMLButtonElement
    expect(windCastButton.disabled).toBe(false)
    await user.click(windCastButton)
    expect(windTile.classList.contains('is-manual-queued')).toBe(true)
    expect(windTile.textContent).toContain('NEXT')
    expect(windTile.textContent).toContain('2.4s')
    expect(useGameStore.getState().combat.queuedPlayerSpellId).toBe('wind-blade')

    await user.click(windCastButton)
    expect(windTile.classList.contains('is-manual-queued')).toBe(false)
    expect(useGameStore.getState().combat.queuedPlayerSpellId).toBeNull()
  })
})
