import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { EnemyCombatCard } from './EnemyCombatCard'

describe('EnemyCombatCard contextual controls', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('does not show Intel or Loot for a route preview or encounter delay', () => {
    render(<TooltipProvider><EnemyCombatCard selectedDungeonId="whispering-woods" /></TooltipProvider>)
    expect(screen.queryByRole('button', { name: 'Open Enemy Intel' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Open Enemy Loot' })).toBeNull()

    useGameStore.getState().preset('combat')
    useGameStore.setState({ combat: { ...useGameStore.getState().combat, enemyId: null } })
    expect(screen.queryByRole('button', { name: 'Open Enemy Intel' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Open Enemy Loot' })).toBeNull()
  })

  it('shows one Intel trigger only for a real active enemy', () => {
    useGameStore.getState().preset('combat')
    render(<TooltipProvider><EnemyCombatCard selectedDungeonId="whispering-woods" /></TooltipProvider>)
    expect(screen.getByRole('button', { name: 'Open Enemy Intel' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Open Enemy Stats' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Open Enemy Loot' })).toBeNull()
  })
})
