import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { CombatWorldNavigation } from './CombatWorldNavigation'

const renderNavigation = (onEnterLocation = vi.fn()) => render(<TooltipProvider><CombatWorldNavigation onSelectLocation={vi.fn()} onEnterLocation={onEnterLocation} onSetCombatTarget={vi.fn(() => true)} onBestiary={vi.fn()} onReturnToCombat={vi.fn()} /></TooltipProvider>)

describe('CombatWorldNavigation', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('shows the hierarchy inline with one unified First Frontier location grid', () => {
    renderNavigation()

    expect(screen.getByText('WORLD NAVIGATION')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Continent I' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'First Frontier' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Whispering Woods, COMBAT ZONE/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Howling Den, DUNGEON/ })).toBeTruthy()
    expect(screen.queryByText('COMBAT ZONES')).toBeNull()
    expect(screen.queryByText('DUNGEONS')).toBeNull()
    expect(screen.getByText('WORLD TIER')).toBeTruthy()
    const tierControl = screen.getByText('WORLD TIER').closest('.combat-world-tier-control')
    expect(tierControl?.classList.contains('is-embedded')).toBe(true)
    expect(tierControl?.querySelector('.card')).toBeNull()
    expect(screen.queryByText('CAMPAIGN')).toBeNull()
  })

  it('keeps locked Regions disabled and exposes the existing unlock milestone', () => {
    renderNavigation()

    const region = screen.getByRole('button', { name: 'The Shattered Frontier' })
    expect(region.hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: /Howling Den, DUNGEON, LOCKED/ })).toBeTruthy()
  })

  it('renders targeted Whispering Woods cards without legacy inspector metrics', () => {
    const onEnterLocation = vi.fn()
    renderNavigation(onEnterLocation)

    expect(screen.getByText('SELECT TARGET')).toBeTruthy()
    for (const name of ['Forest Wisp', 'Thornling', 'Dewbound Sprite', 'Cinder Moth', 'Stone Root', 'Grove Sentinel', 'Tempest Stag']) expect(screen.getByText(name)).toBeTruthy()
    expect(screen.getByText('ZONE BOSS')).toBeTruthy()
    expect(screen.getByText('Forest Heart')).toBeTruthy()
    expect(screen.queryByText('NORMAL KILLS')).toBeNull()
    expect(screen.queryByText('BOSS CLEARS')).toBeNull()
    expect(screen.queryByText('LOCATION STATUS')).toBeNull()
    expect(screen.queryByText('Repeatable combat content. Encounter tiles are preview-only in Phase 3A.')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Cinder MothSTANDARD/ }))
    expect(screen.getByRole('button', { name: /START FARMING/ })).not.toHaveProperty('disabled', true)
    fireEvent.click(screen.getByRole('button', { name: /START FARMING/ }))
    expect(onEnterLocation).toHaveBeenCalledWith('whispering-woods', 'cinder-moth')
  })

  it('lets the player browse another location while the active run remains unchanged', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    useGameStore.setState(state)
    const onSelectLocation = vi.fn()
    render(<TooltipProvider><CombatWorldNavigation onSelectLocation={onSelectLocation} onEnterLocation={vi.fn()} onSetCombatTarget={vi.fn(() => true)} onBestiary={vi.fn()} onReturnToCombat={vi.fn()} /></TooltipProvider>)

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
