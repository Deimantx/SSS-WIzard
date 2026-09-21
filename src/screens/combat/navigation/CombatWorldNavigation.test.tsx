import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { CombatWorldNavigation } from './CombatWorldNavigation'

const renderNavigation = (onEnterLocation = vi.fn()) => render(<TooltipProvider><CombatWorldNavigation onSelectLocation={vi.fn()} onEnterLocation={onEnterLocation} onBestiary={vi.fn()} onReturnToCombat={vi.fn()} /></TooltipProvider>)

describe('CombatWorldNavigation', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('shows the hierarchy inline with grouped First Frontier locations', () => {
    renderNavigation()

    expect(screen.getByText('WORLD NAVIGATION')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Continent I' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'First Frontier' })).toBeTruthy()
    expect(screen.getByText('COMBAT ZONES')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Whispering Woods, COMBAT ZONE/ })).toBeTruthy()
    expect(screen.getByText('DUNGEONS')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Howling Den, DUNGEON/ })).toBeTruthy()
    expect(screen.queryByText('CAMPAIGN')).toBeNull()
  })

  it('keeps locked Regions disabled and exposes the existing unlock milestone', () => {
    renderNavigation()

    const region = screen.getByRole('button', { name: 'The Shattered Frontier' })
    expect(region.hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: /Howling Den, DUNGEON, LOCKED/ })).toBeTruthy()
  })

  it('lets the player browse another location while the active run remains unchanged', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    useGameStore.setState(state)
    const onSelectLocation = vi.fn()
    render(<TooltipProvider><CombatWorldNavigation onSelectLocation={onSelectLocation} onEnterLocation={vi.fn()} onBestiary={vi.fn()} onReturnToCombat={vi.fn()} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: /Howling Den, DUNGEON/ }))

    expect(onSelectLocation).toHaveBeenCalledWith('howling-den')
    expect(useGameStore.getState().combat.active).toBe(true)
    expect(useGameStore.getState().combat.dungeonId).toBe('whispering-woods')
    expect(screen.getByRole('heading', { name: 'Howling Den' })).toBeTruthy()
  })

  it('enters a selected unlocked location only through the Inspector action', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    useGameStore.setState(state)
    const onEnterLocation = vi.fn()
    renderNavigation(onEnterLocation)
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, DUNGEON/ }))
    fireEvent.click(screen.getByRole('button', { name: 'ENTER DUNGEON' }))

    expect(onEnterLocation).toHaveBeenCalledWith('howling-den')
    expect(useGameStore.getState().combat.active).toBe(false)
  })
})
