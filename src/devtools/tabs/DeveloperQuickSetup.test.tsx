import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { DeveloperQuickSetup } from './DeveloperQuickSetup'

describe('Developer Quick Setup', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('exposes the tester-first player, fixture, loadout, resource, and combat controls', () => {
    render(<DeveloperQuickSetup />)
    expect(screen.getByRole('heading', { name: 'Quick Setup' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /God Mode: OFF/ })).toBeTruthy()
    expect(screen.getByText('Whispering Woods Ready')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Woods Fire' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '+100 Relevant Materials' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Jump to Boss' })).toBeTruthy()
  })

  it('uses existing actions for quick recovery, loadout, spawn, and reset controls', () => {
    render(<DeveloperQuickSetup />)
    fireEvent.click(screen.getByRole('button', { name: 'Full Mana' }))
    expect(useGameStore.getState().player.mana).toBe(useGameStore.getState().player.maxMana)
    fireEvent.click(screen.getByRole('button', { name: 'Woods Fire' }))
    expect(useGameStore.getState().equipment.weapon).toBe('ember-staff')
    fireEvent.click(screen.getByRole('button', { name: 'Spawn Enemy' }))
    expect(useGameStore.getState().combat.enemyId).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'God Mode: OFF' }))
    expect(useGameStore.getState().debug.playerImmortal).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Clear Debug Overrides' }))
    expect(useGameStore.getState().debug.playerImmortal).toBe(false)
  })

  it('uses the authored dungeon unlock chain for progression fixtures', () => {
    useGameStore.getState().applyDeveloperFixture('catacombs-ready')
    const state = useGameStore.getState()
    expect(state.combat.dungeonId).toBe('abandoned-catacombs')
    expect(state.progress.bossKillsByBoss['forest-heart']).toBe(1)
    expect(state.progress.bossKillsByBoss['corrupted-greatbear']).toBe(1)
    expect(state.progress.bossKillsByBoss['archmage-edrin-shade']).toBeUndefined()
  })

  it('requires confirmation before resetting to a fresh fixture', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<DeveloperQuickSetup />)
    fireEvent.click(screen.getByRole('button', { name: 'Reset Fresh Game' }))
    expect(confirm).toHaveBeenCalled()
    confirm.mockRestore()
  })

  it('grants exact missing quantities for a selected equipment recipe', () => {
    render(<DeveloperQuickSetup />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Quick Setup recipe' }), { target: { value: 'ember-staff' } })
    fireEvent.click(screen.getByRole('button', { name: 'Grant Missing Ingredients' }))

    expect(useGameStore.getState().inventory).toMatchObject({ 'fire-fragment': 4, 'wisp-essence': 4, 'grove-bark': 1 })
    expect(screen.getByText('Missing ingredients granted for: Ember Staff')).toBeTruthy()
  })

  it('clears the selected enemy and disables selection actions for an empty search', () => {
    render(<DeveloperQuickSetup />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Search quick combat enemies' }), { target: { value: 'no-such-enemy' } })

    expect(screen.getAllByText('No matching enemies').length).toBeGreaterThan(0)
    expect((screen.getByRole('button', { name: 'Spawn Enemy' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Jump to Boss' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('combobox', { name: 'Quick combat enemy' }) as HTMLSelectElement).value).toBe('')
  })
})
