import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { EnemyCombatCard, resolveEnemyPreviewDungeonId } from './EnemyCombatCard'

describe('EnemyCombatCard contextual controls', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('does not show Intel or Loot for a route preview or encounter delay', () => {
    render(<TooltipProvider><EnemyCombatCard selectedDungeonId="whispering-woods" /></TooltipProvider>)
    expect(screen.queryByRole('button', { name: 'Open Enemy Intel' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Open Enemy Loot' })).toBeNull()

    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    useGameStore.setState(state)
    expect(screen.queryByRole('button', { name: 'Open Enemy Intel' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Open Enemy Loot' })).toBeNull()
  })

  it('shows one Intel trigger only for a real active enemy', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyWorldTier = 1
    state.combat.enemyHp = 100
    state.combat.enemyMaxHp = 100
    useGameStore.setState(state)
    render(<TooltipProvider><EnemyCombatCard selectedDungeonId="whispering-woods" /></TooltipProvider>)
    expect(screen.getByRole('button', { name: 'Open Enemy Intel' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Open Enemy Stats' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Open Enemy Loot' })).toBeNull()
  })

  it('keeps the active run route while the player browses another route', () => {
    expect(resolveEnemyPreviewDungeonId({ combatActive: true, combatDungeonId: 'whispering-woods', selectedDungeonId: 'vault-of-the-black-sigil' })).toBe('whispering-woods')
  })

  it('uses the browse route only while combat is inactive', () => {
    expect(resolveEnemyPreviewDungeonId({ combatActive: false, combatDungeonId: 'whispering-woods', selectedDungeonId: 'vault-of-the-black-sigil' })).toBe('vault-of-the-black-sigil')
  })
})
