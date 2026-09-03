import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { setDeveloperCombatTab } from '../../developerToolsStore'
import { DeveloperCombat } from '../DeveloperCombat'

describe('DeveloperCombat ACTIONS tab', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
    setDeveloperCombatTab('actions')
  })

  it('renders an understandable empty state without an active enemy', () => {
    render(<DeveloperCombat copy={async () => undefined} />)

    expect(screen.getByText('Current enemy')).toBeTruthy()
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
    expect(screen.getByText('No active enemy traits.')).toBeTruthy()
  })

  it('renders timing and action controls for a normal enemy', () => {
    useGameStore.getState().spawnDebugEnemy('forest-wisp', 'whispering-woods')
    render(<DeveloperCombat copy={async () => undefined} />)

    expect(screen.getByText('Forest Wisp')).toBeTruthy()
    expect(screen.getByText('Player Basic')).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Action to inspect' })).toBeTruthy()
  })

  it('renders a boss action state safely', () => {
    useGameStore.getState().spawnDebugEnemy('forest-heart', 'whispering-woods')
    render(<DeveloperCombat copy={async () => undefined} />)

    expect(screen.getByText('Forest Heart')).toBeTruthy()
    expect(screen.getByText('Action inspector')).toBeTruthy()
  })

  it('survives switching LIVE to ACTIONS to STATUS and back', () => {
    setDeveloperCombatTab('live')
    render(<DeveloperCombat copy={async () => undefined} />)

    fireEvent.click(screen.getByRole('tab', { name: 'ACTIONS' }))
    fireEvent.click(screen.getByRole('tab', { name: 'STATUS' }))
    fireEvent.click(screen.getByRole('tab', { name: 'ACTIONS' }))

    expect(screen.getByText('Action inspector')).toBeTruthy()
  })
})
