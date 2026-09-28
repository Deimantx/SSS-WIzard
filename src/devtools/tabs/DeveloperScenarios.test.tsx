import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { discardTestSnapshot, hasTestSnapshot } from '../sessionTestSnapshot'
import { DeveloperScenarios } from './DeveloperV4SupportTabs'

describe('Developer Scenario Lab', () => {
  beforeEach(() => {
    discardTestSnapshot()
    useGameStore.setState(createInitialState())
    window.localStorage.clear()
  })

  it('registers the focused combat, progression, research, and production scenarios', () => {
    render(<DeveloperScenarios />)
    for (const label of [
      'Fresh Start', 'Forest Heart Ready', 'Howling Den / Greatbear Ready',
      'Hunter’s Order — First Contract', 'Gloamridge — Active Contract', 'Nightglass Apex Ready',
      'Arcane Guild — Early Progression', 'Arcane Guild — Advancement Test',
      'Research Stress Test', 'Transmutation Stress Test',
    ]) expect(screen.getByRole('heading', { name: label })).toBeTruthy()
  })

  it('prepares accepted Hunter contracts through the authored generation and acceptance actions', () => {
    render(<DeveloperScenarios />)
    const buttonFor = (heading: string) => screen.getByRole('heading', { name: heading }).closest('article')!.querySelector('button')!
    fireEvent.click(buttonFor('Hunter’s Order — First Contract'))
    expect(useGameStore.getState().progress.huntersOrder.activeContract?.targetSpec.type).toBe('monster')

    fireEvent.click(buttonFor('Gloamridge — Active Contract'))
    expect(useGameStore.getState().progress.huntersOrder.activeContract?.targetSpec).toMatchObject({ type: 'region', dungeonId: 'hunters-ground' })
  })

  it('sets up the authored combat and Nightglass Apex encounters', () => {
    render(<DeveloperScenarios />)
    const buttonFor = (heading: string) => screen.getByRole('heading', { name: heading }).closest('article')!.querySelector('button')!
    fireEvent.click(buttonFor('Forest Heart Ready'))
    expect(useGameStore.getState().combat.enemyId).toBe('forest-heart')
    fireEvent.click(buttonFor('Howling Den / Greatbear Ready'))
    expect(useGameStore.getState().combat.enemyId).toBe('corrupted-greatbear')
    fireEvent.click(buttonFor('Nightglass Apex Ready'))
    expect(useGameStore.getState().progress.huntersOrder.activeContract?.targetSpec).toMatchObject({ type: 'boss', monsterId: 'nightglass-alpha' })
    expect(useGameStore.getState().combat.dungeonId).toBe('hunters-ground')
  })

  it('prepares real Arcane Guild, Research, and Transmutation test states', () => {
    render(<DeveloperScenarios />)
    const buttonFor = (heading: string) => screen.getByRole('heading', { name: heading }).closest('article')!.querySelector('button')!
    fireEvent.click(buttonFor('Arcane Guild — Early Progression'))
    expect(useGameStore.getState().progress.guildUnlocked).toBe(true)
    expect(useGameStore.getState().progress.arcaneGuild.availableCommissions.length).toBeGreaterThan(0)
    fireEvent.click(buttonFor('Arcane Guild — Advancement Test'))
    expect(useGameStore.getState().progress.guildRank).toBe('magister')
    expect(useGameStore.getState().progress.guildPointsEarned).toBeGreaterThanOrEqual(12)

    fireEvent.click(buttonFor('Research Stress Test'))
    expect(Object.values(useGameStore.getState().activities.research.slots).filter(Boolean)).toHaveLength(4)

    fireEvent.click(buttonFor('Transmutation Stress Test'))
    expect(useGameStore.getState().activities.transmutation.jobs['prismatic-fragment']).toBeTruthy()
    expect(useGameStore.getState().tower.resources.arcaneFlux).toBeGreaterThan(0)
  })

  it('captures, restores, and discards session-only data without writing a snapshot to storage', () => {
    render(<DeveloperScenarios />)
    const storageBefore = Object.keys(window.localStorage)
    fireEvent.click(screen.getByRole('button', { name: 'Capture test snapshot' }))
    expect(hasTestSnapshot()).toBe(true)
    expect(Object.keys(window.localStorage)).toEqual(storageBefore)

    useGameStore.getState().setDebugPlayerStatValue('core.maxHealthFlat', 500)
    expect(useGameStore.getState().player.maxHealth).toBeGreaterThan(100)
    fireEvent.click(screen.getByRole('button', { name: 'Restore test snapshot' }))
    expect(useGameStore.getState().debug.playerStats.maxHealthFlat).toBe(0)
    expect(useGameStore.getState().player.maxHealth).toBe(100)
    expect(hasTestSnapshot()).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Discard snapshot' }))
    expect(hasTestSnapshot()).toBe(false)
  })
})
