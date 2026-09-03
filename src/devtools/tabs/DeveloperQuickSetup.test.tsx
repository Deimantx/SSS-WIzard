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
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(confirm).toHaveBeenCalled()
    confirm.mockRestore()
  })
})
