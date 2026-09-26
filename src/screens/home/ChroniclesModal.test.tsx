import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GameShell } from '../../app/GameShell'
import { useGameStore } from '../../store/gameStore'

vi.mock('../../components/ArcaneAtmosphere', () => ({ ArcaneAtmosphere: () => null }))

describe('Chronicles Overview and modal', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
    useGameStore.setState((state) => {
      state.progress.startingSchoolId = 'fire'
      state.progress.tutorialStage = 'complete'
      state.ui.screen = 'home'
      state.combat.active = false
    })
  })

  it('keeps Overview compact and opens the full authored Chronicle workspace', async () => {
    const user = userEvent.setup()
    render(<GameShell />)

    expect(screen.getByText('Complete First Frontier')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Open Chronicles/ }).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /Open Chronicles/ }))

    const dialog = screen.getByRole('dialog', { name: 'Chronicles' })
    expect(dialog).toBeTruthy()
    expect(within(dialog).getByRole('tab', { name: /First Frontier/ })).toBeTruthy()
    expect(within(dialog).getByRole('navigation', { name: 'Chronicle tracks' })).toBeTruthy()
    expect(within(dialog).getByText('First Blood')).toBeTruthy()
    expect(within(dialog).getByText('REQUIREMENT')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Close Chronicles' }))
    expect(screen.queryByRole('dialog', { name: 'Chronicles' })).toBeNull()
  })
})
