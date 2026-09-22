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

  it('uses the active Location label without duplicating the Zone Boss inspector', () => {
    render(<TooltipProvider><CombatRunBar selectedDungeonId="whispering-woods" onRequestLeave={vi.fn()} /></TooltipProvider>)

    expect(screen.getByText('CURRENT LOCATION')).toBeTruthy()
    expect(screen.getByText('COMBAT ZONE')).toBeTruthy()
    expect(screen.queryByText('THREAT')).toBeNull()
    expect(screen.queryByText('20 MORE KILLS TO BOSS')).toBeNull()
    expect(screen.queryByText('Forest Heart')).toBeNull()
    expect(document.querySelector('.combat-run-boss-hunt')).toBeNull()
    expect(document.querySelector('.combat-run-threat')).toBeNull()
    expect(screen.queryByText('AUTO HUNT')).toBeNull()
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

  it('keeps Elite Zone boss details out of the compact run bar', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.combat.active = true
    state.combat.dungeonId = 'howling-den'
    state.combat.enemyId = 'bonehide-boar'
    state.combat.targetEnemyId = 'bonehide-boar'
    useGameStore.setState(state)
    const { container } = render(<TooltipProvider><CombatRunBar selectedDungeonId="howling-den" onRequestLeave={vi.fn()} /></TooltipProvider>)

    expect(screen.queryByText('ELITE BOSS')).toBeNull()
    expect(screen.queryByText('Corrupted Greatbear')).toBeNull()
    expect(screen.queryByText('25 MORE KILLS TO BOSS')).toBeNull()
    expect(screen.queryByText('THREAT')).toBeNull()
    expect(screen.queryByText('AUTO HUNT')).toBeNull()
    expect(container.querySelector('.combat-run-boss-hunt')).toBeNull()
    expect(screen.getByRole('button', { name: 'LEAVE' })).toBeTruthy()
  })

  it('shows the active target context without adding boss controls', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.combat.active = true
    state.combat.dungeonId = 'howling-den'
    state.combat.enemyId = 'bonehide-boar'
    state.combat.targetEnemyId = 'bonehide-boar'
    useGameStore.setState(state)
    render(<TooltipProvider><CombatRunBar selectedDungeonId="howling-den" onRequestLeave={vi.fn()} /></TooltipProvider>)

    expect(screen.getByText('HUNTING')).toBeTruthy()
    expect(screen.getByText('Bonehide Boar')).toBeTruthy()
    expect(screen.queryByText('ELITE BOSS')).toBeNull()
    expect(screen.queryByText('THREAT')).toBeNull()
  })

  it('keeps sequence runs separate from Threat and Auto Hunt', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.combat.active = true
    state.combat.dungeonId = 'abandoned-catacombs'
    state.combat.enemyId = 'restless-skeleton'
    state.combat.dungeonSequenceIndex = 0
    useGameStore.setState(state)
    render(<TooltipProvider><CombatRunBar selectedDungeonId="abandoned-catacombs" onRequestLeave={vi.fn()} /></TooltipProvider>)

    expect(screen.getByText('FINAL BOSS')).toBeTruthy()
    expect(screen.queryByText('THREAT')).toBeNull()
    expect(screen.queryByText('AUTO HUNT')).toBeNull()
  })
})
