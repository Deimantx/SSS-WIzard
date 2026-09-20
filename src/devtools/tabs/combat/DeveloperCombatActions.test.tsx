import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { setDeveloperCombatTab } from '../../developerToolsStore'
import { DeveloperCombat } from '../DeveloperCombat'

describe('DeveloperCombat ACTIONS tab', () => {
  const enableDebugCombatSpawn = () => {
    const state = useGameStore.getState()
    useGameStore.setState({ combat: { ...state.combat, activeSpellLoadout: { presetId: null, presetName: 'Developer Combat', slots: [{ spellId: 'fire-bolt', autoCast: false }], signature: 'fire-bolt:0' } } })
  }

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
    enableDebugCombatSpawn()
    useGameStore.getState().spawnDebugEnemy('forest-wisp', 'whispering-woods')
    render(<DeveloperCombat copy={async () => undefined} />)

    expect(screen.getByText('Forest Wisp')).toBeTruthy()
    expect(screen.queryByText('Player Basic')).toBeNull()
    expect(screen.getByText('Enemy base work')).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Action to inspect' })).toBeTruthy()
  })

  it('renders a boss action state safely', () => {
    enableDebugCombatSpawn()
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
