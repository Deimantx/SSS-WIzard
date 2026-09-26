import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GameShell } from '../../app/GameShell'
import { useGameStore } from '../../store/gameStore'

vi.mock('../../components/ArcaneAtmosphere', () => ({ ArcaneAtmosphere: () => null }))

describe('Developer Chronicles tab', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
    useGameStore.setState((state) => { state.ui.screen = 'home' })
  })

  it('exposes Chronicle actions in a dedicated developer section', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await user.click(screen.getByRole('button', { name: 'Dev Tools' }))
    const devNav = within(screen.getByRole('navigation', { name: 'Developer tool sections' }))
    await user.click(devNav.getByRole('button', { name: 'Chronicles' }))

    expect(screen.getByRole('heading', { name: 'Chronicles · tester workspace' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reconcile Now' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Complete Chapter' })).toBeTruthy()
    expect(screen.getByText('Chronicle event flags')).toBeTruthy()
  })
})
