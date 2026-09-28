import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { DeveloperCharacter } from './DeveloperCharacter'
import { getPlayerCombatStats, MAX_CRIT_CHANCE } from '../../game/systems/combat/combatStats'

describe('Developer Character Player Stat Lab', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('edits a structured transient override and refreshes the resolved values', () => {
    render(<DeveloperCharacter />)
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Max HP Flat' }), { target: { value: '500' } })
    expect(useGameStore.getState().debug.playerStats.maxHealthFlat).toBe(500)
    expect(screen.getByText('STAT OVERRIDES ACTIVE')).toBeTruthy()
    expect(screen.getByText('Resolved live combat stats')).toBeTruthy()
  })

  it('applies and clears presets, and provides current barrier and resource shortcuts', () => {
    render(<DeveloperCharacter />)
    fireEvent.click(screen.getByRole('button', { name: 'Crit Cap' }))
    expect(getPlayerCombatStats(useGameStore.getState()).critChance).toBe(MAX_CRIT_CHANCE)
    fireEvent.click(screen.getByRole('button', { name: '+500 Spell Power' }))
    expect(useGameStore.getState().debug.playerStats.spellPowerFlat).toBe(500)
    fireEvent.click(screen.getByRole('button', { name: 'Tank' }))
    expect(useGameStore.getState().debug.playerStats.modifiers['defense-flat']).toBe(200)
    expect(useGameStore.getState().debug.playerStats.resistanceByType.fire).toBe(0.25)
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(useGameStore.getState().debug.playerStats.maxHealthFlat).toBe(0)
    expect(useGameStore.getState().debug.playerStats.modifiers['defense-flat']).toBeUndefined()
    fireEvent.click(screen.getByRole('button', { name: 'Barrier +100' }))
    expect(useGameStore.getState().combat.playerBarrier).toBe(100)
    fireEvent.click(screen.getByRole('button', { name: 'Barrier Fill' }))
    expect(useGameStore.getState().combat.playerBarrier).toBe(useGameStore.getState().player.maxHealth)
    fireEvent.click(screen.getByRole('button', { name: '10% HP' }))
    expect(useGameStore.getState().player.health).toBe(Math.round(useGameStore.getState().player.maxHealth * 0.1))
  })

  it('does not add native selects, checkboxes, or title tooltips', () => {
    const { container } = render(<DeveloperCharacter />)
    expect(container.querySelector('select, input[type="checkbox"], input[type="radio"], [title]')).toBeNull()
  })

  it('clears the lab from both combat-debug reset and all-debug reset actions', () => {
    const baseline = useGameStore.getState()
    const store = useGameStore.getState()
    store.setDebugPlayerStatValue('core.maxHealthFlat', 750)
    store.setDebugPlayerStatValue('core.maxManaFlat', 750)
    useGameStore.getState().setPlayer({ health: useGameStore.getState().player.maxHealth, mana: useGameStore.getState().player.maxMana })
    expect(useGameStore.getState().player.health).toBeGreaterThan(baseline.player.maxHealth)
    expect(useGameStore.getState().player.mana).toBeGreaterThan(baseline.player.maxMana)
    store.clearCombatDebugOverrides()
    expect(useGameStore.getState().debug.playerStats.maxHealthFlat).toBe(0)
    expect(useGameStore.getState().player.maxHealth).toBe(baseline.player.maxHealth)
    expect(useGameStore.getState().player.health).toBe(baseline.player.maxHealth)
    expect(useGameStore.getState().player.maxMana).toBe(baseline.player.maxMana)
    expect(useGameStore.getState().player.mana).toBe(baseline.player.maxMana)
    useGameStore.getState().setDebugPlayerStatValue('modifiers.damage-dealt-percent', 0.5)
    useGameStore.getState().resetDebugOverrides()
    expect(useGameStore.getState().debug.playerStats.modifiers['damage-dealt-percent']).toBeUndefined()
  })
})
