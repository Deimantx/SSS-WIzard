import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { discardDeveloperSandboxSnapshot, hasDeveloperSandboxSnapshot, restoreAndExitDeveloperSandbox } from '../developerSandbox'
import { clearDeveloperSandbox, getDeveloperToolsState, setCustomScenarioLibraryExpanded, setScenarioGroupExpanded } from '../developerToolsStore'
import { createProfile, enterProfile, leaveToProfiles } from '../../profiles/profileController'
import { getActiveProfileId, refreshProfiles, setActiveProfileId } from '../../profiles/profileSessionStore'
import { loadProfileGame, validateProfileCandidate } from '../../persistence/profileSaveManager'
import { profileSaveBackupKey, profileSaveKey } from '../../profiles/profileKeys'
import { DeveloperScenarios } from './DeveloperV4SupportTabs'
import { useDeveloperGameStore } from '../developerSandbox'
import { getSaveDiagnostics } from '../../persistence/saveDiagnosticsStore'
import { applyTestReadyPlayerPreset } from '../scenarios/scenarioStatPresets'
import { createDefaultScenarioReadyPreset } from '../scenarios/scenarioReadyPresetStore'
import { getNavigationIntent } from '../../ui/navigation/navigationIntent'

describe('Developer Scenario Lab', () => {
  beforeEach(() => {
    if (getDeveloperToolsState().sandbox.active) restoreAndExitDeveloperSandbox()
    else discardDeveloperSandboxSnapshot()
    clearDeveloperSandbox()
    setActiveProfileId(null)
    useGameStore.setState(createInitialState())
    window.localStorage.clear()
    setScenarioGroupExpanded({ Foundation: true, Combat: true, 'Hunter’s Order': true, 'Arcane Guild': true, 'Tower Systems': true })
    refreshProfiles()
  })
  afterEach(() => { if (getDeveloperToolsState().sandbox.active) restoreAndExitDeveloperSandbox(); else discardDeveloperSandboxSnapshot() })

  it('registers the focused combat, progression, research, and production scenarios', () => {
    render(<DeveloperScenarios />)
    for (const label of [
      'Fresh Start', 'Forest Heart Ready', 'Howling Den / Greatbear Ready',
      'Hunter’s Order — First Contract', 'Gloamridge — Active Contract', 'Nightglass Alpha — Master Quarry',
      'Arcane Guild — Early Progression', 'Arcane Guild — Advancement Test',
      'Research Stress Test', 'Transmutation Stress Test',
    ]) expect(screen.getByRole('heading', { name: label })).toBeTruthy()
  })

  it('auto-enters Sandbox before a wrapped gameplay action mutates the runtime', () => {
    useDeveloperGameStore.getState().addItem('fire-fragment', 100)
    expect(getDeveloperToolsState().sandbox.active).toBe(true)
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(100)
  })

  it('auto-sandboxes and restores Player Stat Lab, Barrier, and Hunter progression mutations', () => {
    const originalHunter = structuredClone(useGameStore.getState().progress.huntersOrder)
    const dev = useDeveloperGameStore.getState()
    dev.applyDebugPlayerStatPreset('spell-power')
    expect(getDeveloperToolsState().sandbox.active).toBe(true)
    expect(useGameStore.getState().debug.playerStats.spellPowerFlat).toBe(500)
    dev.setPlayerBarrierForDebug(100)
    expect(useGameStore.getState().combat.playerBarrier).toBe(100)
    expect(restoreAndExitDeveloperSandbox()).toBe(true)
    expect(useGameStore.getState().debug.playerStats.spellPowerFlat).toBe(0)
    expect(useGameStore.getState().combat.playerBarrier).toBe(0)

    useDeveloperGameStore.getState().debugSetHunterRank('master-hunter')
    expect(getDeveloperToolsState().sandbox.active).toBe(true)
    expect(useGameStore.getState().progress.huntersOrder.rankId).toBe('master-hunter')
    expect(restoreAndExitDeveloperSandbox()).toBe(true)
    expect(useGameStore.getState().progress.huntersOrder).toEqual(originalHunter)
  })

  it('blocks profile entry and leaving while test runtime is active', () => {
    expect(createProfile('slot-1', 'Switch Guard').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    useDeveloperGameStore.getState().addItem('fire-fragment', 12)
    expect(leaveToProfiles()).toMatchObject({ ok: false })
    expect(enterProfile('slot-1')).toMatchObject({ ok: false })
    expect(getActiveProfileId()).toBe('slot-1')
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(12)
  })

  it('prepares accepted Hunter contracts through the authored generation and acceptance actions', () => {
    render(<DeveloperScenarios />)
    const buttonFor = (heading: string) => screen.getByRole('heading', { name: heading }).closest('article')!.querySelector('button')!
    fireEvent.click(buttonFor('Hunter’s Order — First Contract'))
    expect(useGameStore.getState().progress.huntersOrder.activeContract?.targetSpec.type).toBe('monster')

    fireEvent.click(buttonFor('Gloamridge — Active Contract'))
    expect(useGameStore.getState().progress.huntersOrder.activeContract?.targetSpec).toMatchObject({ type: 'region', dungeonId: 'hunters-ground' })
  })

  it('sets up the authored combat and Nightglass Master Quarry encounter', () => {
    render(<DeveloperScenarios />)
    const buttonFor = (heading: string) => screen.getByRole('heading', { name: heading }).closest('article')!.querySelector('button')!
    fireEvent.click(buttonFor('Forest Heart Ready'))
    expect(useGameStore.getState().combat.enemyId).toBe('forest-heart')
    fireEvent.click(buttonFor('Howling Den / Greatbear Ready'))
    expect(useGameStore.getState().combat.enemyId).toBe('corrupted-greatbear')
    fireEvent.click(buttonFor('Nightglass Alpha — Master Quarry'))
    expect(useGameStore.getState().progress.huntersOrder.activeContract?.targetSpec).toMatchObject({ type: 'monster', monsterId: 'nightglass-alpha' })
    expect(getNavigationIntent()).toMatchObject({ combatDungeonId: 'hunters-ground', combatMonsterId: 'nightglass-alpha' })
  })

  it('separates RAW encounter setup from the finite TEST READY player preset', () => {
    render(<DeveloperScenarios />)
    const card = screen.getByRole('heading', { name: 'Forest Heart Ready' }).closest('article')!
    fireEvent.click(card.querySelector('button[aria-label="RAW"]') ?? card.querySelectorAll('button')[0]!)
    expect(useGameStore.getState().combat.enemyId).toBe('forest-heart')
    expect(useGameStore.getState().debug.playerStats.maxHealthFlat).toBe(0)
    fireEvent.click(card.querySelectorAll('button')[1]!)
    expect(useGameStore.getState().debug.playerStats.maxHealthFlat).toBe(500)
    expect(useGameStore.getState().debug.playerImmortal).toBe(false)
    expect(useGameStore.getState().debug.infiniteMana).toBe(false)
    expect(useGameStore.getState().player.health).toBe(useGameStore.getState().player.maxHealth)
    expect(useGameStore.getState().combat.activeSpellLoadout?.slots.map((slot) => slot.spellId)).toContain('fire-bolt')
  })

  it('edits and persists a scenario-specific Ready preset that TEST READY applies', async () => {
    const { unmount } = render(<DeveloperScenarios />)
    const card = screen.getByRole('heading', { name: 'Nightglass Alpha — Master Quarry' }).closest('article')!
    fireEvent.click(card.querySelector('button[aria-label="Edit Test Ready preset for Nightglass Alpha — Master Quarry"]')!)
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Max Health Flat' }), { target: { value: '2500' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Spell Power Flat' }), { target: { value: '700' } })
    await new Promise((resolve) => setTimeout(resolve, 300))
    fireEvent.click(screen.getByRole('button', { name: 'DONE' }))
    unmount()
    render(<DeveloperScenarios />)
    const remounted = screen.getByRole('heading', { name: 'Nightglass Alpha — Master Quarry' }).closest('article')!
    expect(remounted.textContent).toContain('Custom')
    fireEvent.click(remounted.querySelectorAll('button')[1])
    expect(useGameStore.getState().debug.playerStats.maxHealthFlat).toBe(2500)
    expect(useGameStore.getState().debug.playerStats.spellPowerFlat).toBe(700)
  })

  it('TEST READY replaces only Player Stat Lab state and preserves unrelated debug fixture settings', () => {
    const state = useGameStore.getState()
    state.setDebugIgnoreAcolyteLimit(true)
    state.setDebugAcolyteTotalOverride(17)
    state.setDebugArcaneFluxCapacity(4321)
    const preset = createDefaultScenarioReadyPreset()
    preset.stats = { 'core.maxHealthFlat': 300 }
    applyTestReadyPlayerPreset(preset)
    expect(useGameStore.getState().debug.playerStats.maxHealthFlat).toBe(300)
    expect(useGameStore.getState().debug.ignoreAcolyteLimit).toBe(true)
    expect(useGameStore.getState().debug.acolyteTotalOverride).toBe(17)
    expect(useGameStore.getState().debug.arcaneFluxCapacityOverride).toBe(4321)
  })

  it('uses explicit Test Ready capability instead of inferring it from group names', () => {
    render(<DeveloperScenarios />)
    const hunter = screen.getByRole('heading', { name: 'Gloamridge — Active Contract' }).closest('article')!
    const veteran = screen.getByRole('heading', { name: 'Hunter’s Order — Veteran Progression' }).closest('article')!
    const guild = screen.getByRole('heading', { name: 'Arcane Guild — Early Progression' }).closest('article')!
    expect(hunter.querySelector('button[aria-label="Edit Test Ready preset for Gloamridge — Active Contract"]')).toBeTruthy()
    expect(veteran.textContent).not.toContain('TEST READY')
    expect(guild.textContent).not.toContain('TEST READY')
  })

  it('collapses scenario groups and the Custom Scenario Library while keeping their summaries visible', () => {
    render(<DeveloperScenarios />)
    fireEvent.click(screen.getByRole('button', { name: 'COLLAPSE ALL' }))
    expect(screen.queryByRole('heading', { name: 'Fresh Start' })).toBeNull()
    expect(JSON.parse(window.localStorage.getItem('sss-wizard-devtools-session-v4') ?? '{}').scenarioGroupExpanded.Combat).toBe(false)
    act(() => setCustomScenarioLibraryExpanded(false))
    expect(screen.getByText('0 saved')).toBeTruthy()
    expect(document.querySelector('.scenario-library-toolbar')).toBeNull()
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
    expect(hasDeveloperSandboxSnapshot()).toBe(true)
    expect(getDeveloperToolsState().sandbox.active).toBe(true)
    expect(screen.getByText(/DEV SANDBOX ACTIVE/)).toBeTruthy()
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(100)
    expect(useGameStore.getState().saveGame('autosave')).toMatchObject({ ok: true, skipped: true, reason: 'developer-sandbox' })
    expect(window.localStorage.getItem(profileSaveKey('slot-1'))).toBe(before)

    fireEvent.click(screen.getByRole('button', { name: 'RESTORE SNAPSHOT & EXIT SANDBOX' }))
    expect(getDeveloperToolsState().sandbox.active).toBe(false)
    expect(useGameStore.getState().inventory['fire-fragment'] ?? 0).toBe(0)
    expect(useGameStore.getState().saveGame('manual').ok).toBe(true)
    const saved = loadProfileGame(getActiveProfileId()!).state!
    expect(saved.inventory['fire-fragment'] ?? 0).toBe(0)
    expect(Object.values(saved.activities.research.slots).filter(Boolean)).toHaveLength(0)
  })

  it('automatically captures and restores session-only data without writing a snapshot to storage', () => {
    render(<DeveloperScenarios />)
    const storageBefore = Object.keys(window.localStorage)
    const buttonFor = (heading: string) => screen.getByRole('heading', { name: heading }).closest('article')!.querySelector('button')!
    fireEvent.click(buttonFor('Fresh Start'))
    expect(hasDeveloperSandboxSnapshot()).toBe(true)
    expect(Object.keys(window.localStorage)).toEqual(storageBefore)

    useGameStore.getState().setDebugPlayerStatValue('core.maxHealthFlat', 500)
    expect(useGameStore.getState().player.maxHealth).toBeGreaterThan(100)
    fireEvent.click(screen.getByRole('button', { name: 'RESTORE SNAPSHOT & EXIT SANDBOX' }))
    expect(useGameStore.getState().debug.playerStats.maxHealthFlat).toBe(0)
    expect(useGameStore.getState().player.maxHealth).toBe(100)
    expect(hasDeveloperSandboxSnapshot()).toBe(false)
    expect(getDeveloperToolsState().sandbox.active).toBe(false)
  })

  it('runs Tank combat and Offline Bank in memory, then restores the clean profile', async () => {
    expect(createProfile('slot-1', 'Tank Sandbox').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    const initialRuntime = useGameStore.getState()
    const original = { health: initialRuntime.player.health, maxHealth: initialRuntime.player.maxHealth, offlineBankMs: initialRuntime.offlineBankMs }
    const primaryBefore = window.localStorage.getItem(profileSaveKey('slot-1'))
    const backupBefore = window.localStorage.getItem(profileSaveBackupKey('slot-1'))
    const dev = useDeveloperGameStore.getState()
    dev.applyDebugPlayerStatPreset('tank')
    dev.setPlayer({ health: useGameStore.getState().player.maxHealth })
    dev.spawnDebugEnemy('forest-wisp', 'whispering-woods')
    dev.debugAddOfflineBank(60_000)
    dev.setChannelingAcolytesDebug(1)

    const boostedMax = useGameStore.getState().player.maxHealth
    expect(getDeveloperToolsState().sandbox).toMatchObject({ active: true, snapshotPresent: true })
    expect(boostedMax).toBeGreaterThanOrEqual(original.maxHealth + 500)
    expect(useGameStore.getState().player.health).toBe(boostedMax)
    expect(useGameStore.getState().combat.active).toBe(true)

    const advanced = await useGameStore.getState().advanceWithOfflineBank(60_000)
    expect(advanced.ok).toBe(true)
    expect(useGameStore.getState().offlineBankMs).toBe(0)
    expect(window.localStorage.getItem(profileSaveKey('slot-1'))).toBe(primaryBefore)
    expect(window.localStorage.getItem(profileSaveBackupKey('slot-1'))).toBe(backupBefore)
    expect(getSaveDiagnostics().health).toBe('healthy')
    expect(getDeveloperToolsState().sandbox.snapshotPresent).toBe(true)

    expect(restoreAndExitDeveloperSandbox()).toBe(true)
    const restored = useGameStore.getState()
    expect(restored.player.maxHealth).toBe(original.maxHealth)
    expect(restored.player.health).toBe(original.health)
    expect(restored.debug.playerStats.maxHealthFlat).toBe(0)
    expect(restored.combat.active).toBe(false)
    expect(restored.offlineBankMs).toBe(original.offlineBankMs)
    expect(getDeveloperToolsState().sandbox.active).toBe(false)
    expect(validateProfileCandidate('slot-1', restored).ok).toBe(true)
    expect(restored.saveGame('manual').ok).toBe(true)
  })

  it('keeps normal Offline Bank advancement transactional and rotates the previous primary to backup', async () => {
    expect(createProfile('slot-1', 'Normal Offline').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    const primaryBefore = window.localStorage.getItem(profileSaveKey('slot-1'))
    useGameStore.setState((state) => {
      state.activities.channeling.acolytesAssigned = 1
      state.offlineBankMs = 300_000
      return state
    })

    const result = await useGameStore.getState().advanceWithOfflineBank(300_000)
    expect(result.ok).toBe(true)
    expect(window.localStorage.getItem(profileSaveBackupKey('slot-1'))).toBe(primaryBefore)
    expect(loadProfileGame('slot-1').state?.offlineBankMs).toBe(0)
    expect(useGameStore.getState().offlineBankMs).toBe(0)
    expect(getDeveloperToolsState().sandbox.active).toBe(false)
  })
})
