import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { CombatRunBar } from './CombatRunBar'

describe('CombatRunBar world terminology', () => {
  beforeEach(() => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    useGameStore.setState(state)
  })

  it('uses the active Location label and keeps only current-run management actions', () => {
    render(<TooltipProvider><CombatRunBar selectedDungeonId="whispering-woods" onRequestLeave={vi.fn()} /></TooltipProvider>)

    expect(screen.getByText('CURRENT LOCATION')).toBeTruthy()
    expect(screen.getByText(/COMBAT ZONE ·/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'LEAVE' })).toBeTruthy()
    expect(screen.queryByText('CAMPAIGN')).toBeNull()
    expect(screen.queryByRole('button', { name: /ENTER/ })).toBeNull()
  })

  it('uses an explicit idle state when no combat is active', () => {
    useGameStore.setState(createInitialState())
    render(<TooltipProvider><CombatRunBar selectedDungeonId="whispering-woods" onRequestLeave={vi.fn()} /></TooltipProvider>)
    expect(screen.getByText('NO ACTIVE COMBAT')).toBeTruthy()
    expect(screen.getByText('Select a Location and target to begin.')).toBeTruthy()
    expect(screen.queryByText('AT THE TOWER')).toBeNull()
    expect(screen.queryByText('THREAT ·')).toBeNull()
  })

  it('shows a target only for an active targeted Location', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.targetEnemyId = 'cinder-moth'
    state.combat.enemyId = 'cinder-moth'
    useGameStore.setState(state)
    render(<TooltipProvider><CombatRunBar selectedDungeonId="whispering-woods" onRequestLeave={vi.fn()} /></TooltipProvider>)
    expect(screen.getByText('HUNTING')).toBeTruthy()
    expect(screen.getByText('Cinder Moth')).toBeTruthy()
    expect(screen.getByText('CURRENT TARGET')).toBeTruthy()
    expect(screen.queryByText('NEXT NORMAL ENCOUNTER')).toBeNull()
  })
})
