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

  it('keeps cooldown presentation on the icon with a readable countdown', () => {
    const current = useGameStore.getState()
    useGameStore.setState({ combat: { ...current.combat, active: true, enemyId: 'forest-wisp', spellCooldowns: { ...current.combat.spellCooldowns, 'fire-bolt': 3400 } } })
    const { container } = render(<TooltipProvider><CombatSpellDeck /></TooltipProvider>)
    expect(container.querySelector('.spell-combat-cooldown-overlay')).toBeTruthy()
    expect(screen.getByText('3.4')).toBeTruthy()
    expect(container.querySelector('.spell-combat-cooldown-mask')).toBeNull()
  })
})
