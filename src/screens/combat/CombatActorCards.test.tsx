import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { EnemyCombatCard } from './EnemyCombatCard'
import { PlayerCombatCard } from './PlayerCombatCard'

describe('Combat actor card symmetry', () => {
  beforeEach(() => { window.localStorage.clear(); useGameStore.getState().resetSave(); useGameStore.getState().preset('combat') })

  it('keeps the Player header restrained and moves timing out of the card', () => {
    render(<TooltipProvider><PlayerCombatCard /></TooltipProvider>)
    expect(screen.getByText('YOUR WIZARD')).toBeTruthy()
    expect(document.querySelector('.combat-player-card .combat-actor-mark')).toBeNull()
    expect(screen.getByText('BASIC ATTACK')).toBeTruthy()
    expect(screen.queryByText('Next Attack')).toBeNull()
    expect(screen.queryByText('Attack progress')).toBeNull()
  })

  it('uses the same header hierarchy and resource family for a real enemy', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ combat: { ...state.combat, enemyId: 'grove-sentinel', enemyHp: 360, enemyMaxHp: 360 } })
    render(<TooltipProvider><EnemyCombatCard selectedDungeonId="whispering-woods" /></TooltipProvider>)
    expect(screen.getByText('Grove Sentinel')).toBeTruthy()
    expect(screen.getByText('ENEMY')).toBeTruthy()
    expect(document.querySelectorAll('.combat-enemy-card .combat-resource')).toHaveLength(2)
    expect(document.querySelector('.combat-enemy-card .combat-enemy-identity')).toBeNull()
  })
})
