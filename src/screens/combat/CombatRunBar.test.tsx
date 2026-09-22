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
    expect(screen.getByText('COMBAT ZONE')).toBeTruthy()
    expect(screen.getByText('THREAT')).toBeTruthy()
    expect(screen.getByText('20 MORE KILLS TO BOSS')).toBeTruthy()
    expect(document.querySelector('.combat-run-boss-hunt')).toBeTruthy()
    expect(document.querySelector('.combat-run-threat')).toBeNull()
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

  it('labels the Elite Zone boss and keeps the global hunt states in one cluster', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.combat.active = true
    state.combat.dungeonId = 'howling-den'
    state.combat.enemyId = 'bonehide-boar'
    state.combat.targetEnemyId = 'bonehide-boar'
    useGameStore.setState(state)
    const { container } = render(<TooltipProvider><CombatRunBar selectedDungeonId="howling-den" onRequestLeave={vi.fn()} /></TooltipProvider>)

    expect(screen.getByText('ELITE BOSS')).toBeTruthy()
    expect(screen.getByText('Corrupted Greatbear')).toBeTruthy()
    expect(screen.getByText('25 MORE KILLS TO BOSS')).toBeTruthy()
    expect(container.querySelector('.combat-run-boss-hunt .combat-run-toggle')).toBeTruthy()
  })

  it('shows ready, queued, and fighting copy inside the Boss Hunt cluster', () => {
    const ready = createInitialState()
    ready.progress.bossKillsByBoss['forest-heart'] = 1
    ready.combat.active = true
    ready.combat.dungeonId = 'howling-den'
    ready.combat.threatCleared = 25
    useGameStore.setState(ready)
    const readyView = render(<TooltipProvider><CombatRunBar selectedDungeonId="howling-den" onRequestLeave={vi.fn()} /></TooltipProvider>)
    expect(screen.getByText('BOSS READY')).toBeTruthy()
    expect(screen.getByRole('button', { name: /ENGAGE CORRUPTED GREATBEAR/ })).toBeTruthy()
    readyView.unmount()

    const queuedBase = createInitialState()
    queuedBase.progress.bossKillsByBoss['forest-heart'] = 1
    queuedBase.progress.autoHuntBossUnlocked = true
    queuedBase.combat.active = true
    queuedBase.combat.dungeonId = 'howling-den'
    queuedBase.combat.threatCleared = 25
    queuedBase.combat.pendingBossId = 'corrupted-greatbear'
    useGameStore.setState(queuedBase)
    const queuedView = render(<TooltipProvider><CombatRunBar selectedDungeonId="howling-den" onRequestLeave={vi.fn()} /></TooltipProvider>)
    expect(screen.getByText('AUTO HUNT QUEUED')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /ENGAGE CORRUPTED GREATBEAR/ })).toBeNull()
    queuedView.unmount()

    queuedBase.combat.pendingBossId = null
    queuedBase.combat.enemyId = 'corrupted-greatbear'
    queuedBase.combat.inBossFight = true
    useGameStore.setState(queuedBase)
    render(<TooltipProvider><CombatRunBar selectedDungeonId="howling-den" onRequestLeave={vi.fn()} /></TooltipProvider>)
    expect(screen.getByText('BOSS FIGHT')).toBeTruthy()
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
