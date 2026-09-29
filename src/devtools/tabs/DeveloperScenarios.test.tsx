import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { discardTestSnapshot, hasTestSnapshot } from '../sessionTestSnapshot'
import { getDeveloperToolsState, setDeveloperTestSessionActive } from '../developerToolsStore'
import { createProfile, enterProfile } from '../../profiles/profileController'
import { getActiveProfileId, refreshProfiles, setActiveProfileId } from '../../profiles/profileSessionStore'
import { loadProfileGame } from '../../persistence/profileSaveManager'
import { profileSaveKey } from '../../profiles/profileKeys'
import { DeveloperScenarios } from './DeveloperV4SupportTabs'

describe('Developer Scenario Lab', () => {
  beforeEach(() => {
    setDeveloperTestSessionActive(false)
    setActiveProfileId(null)
    discardTestSnapshot()
    useGameStore.setState(createInitialState())
    window.localStorage.clear()
    refreshProfiles()
  })
  afterEach(() => setDeveloperTestSessionActive(false))

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

  it('automatically snapshots and pauses profile saves before running a scenario', () => {
    expect(createProfile('slot-1', 'Scenario Test').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    const before = window.localStorage.getItem(profileSaveKey('slot-1'))
    render(<DeveloperScenarios />)
    const buttonFor = (heading: string) => screen.getByRole('heading', { name: heading }).closest('article')!.querySelector('button')!
    fireEvent.click(buttonFor('Research Stress Test'))
    expect(hasTestSnapshot()).toBe(true)
    expect(getDeveloperToolsState().testSessionActive).toBe(true)
    expect(screen.getByText(/DEV TEST SESSION/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Discard snapshot' }).hasAttribute('disabled')).toBe(true)
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(100)
    expect(useGameStore.getState().saveGame('autosave').ok).toBe(false)
    expect(window.localStorage.getItem(profileSaveKey('slot-1'))).toBe(before)

    fireEvent.click(screen.getByRole('button', { name: 'Restore snapshot & end test session' }))
    expect(getDeveloperToolsState().testSessionActive).toBe(false)
    expect(useGameStore.getState().inventory['fire-fragment'] ?? 0).toBe(0)
    expect(useGameStore.getState().saveGame('manual').ok).toBe(true)
    const saved = loadProfileGame(getActiveProfileId()!).state!
    expect(saved.inventory['fire-fragment'] ?? 0).toBe(0)
    expect(Object.values(saved.activities.research.slots).filter(Boolean)).toHaveLength(0)
  })

  it('captures, restores, and discards session-only data without writing a snapshot to storage', () => {
    render(<DeveloperScenarios />)
    const storageBefore = Object.keys(window.localStorage)
    fireEvent.click(screen.getByRole('button', { name: 'Capture test snapshot' }))
    expect(hasTestSnapshot()).toBe(true)
    expect(Object.keys(window.localStorage)).toEqual(storageBefore)

    useGameStore.getState().setDebugPlayerStatValue('core.maxHealthFlat', 500)
    expect(useGameStore.getState().player.maxHealth).toBeGreaterThan(100)
    fireEvent.click(screen.getByRole('button', { name: 'Restore snapshot & end test session' }))
    expect(useGameStore.getState().debug.playerStats.maxHealthFlat).toBe(0)
    expect(useGameStore.getState().player.maxHealth).toBe(100)
    expect(hasTestSnapshot()).toBe(true)
    expect(getDeveloperToolsState().testSessionActive).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Discard snapshot' }))
    expect(hasTestSnapshot()).toBe(false)
  })
})
