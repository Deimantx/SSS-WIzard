import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { getUiPreferences, setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { HunterBestiaryTab } from './HunterBestiaryTab'
import { openHunterBestiaryEntry } from '../../ui/navigation/hunterOrderNavigation'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'

const renderBestiary = () => render(<TooltipProvider><HunterBestiaryTab /></TooltipProvider>)

describe('Hunter Bestiary field workspace', () => {
  beforeEach(() => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.progress.discoveredMonsters = ['veilwing-harrier', 'gloamfang-stalker', 'cinderback-mauler']
    state.progress.huntersOrder.reputation = 9000
    state.progress.huntersOrder.activeContract = { id: 'routine-predators', targetSpec: { type: 'family', familyId: 'Gloamridge Predators' }, target: 153, progress: 84, tier: 'routine', reputationReward: 306, marksReward: 3 }
    useGameStore.setState(state)
    setUiPreferences({ screenState: { huntersOrder: { activeTab: 'bestiary' } } })
  })

  it('composes the Contract Targets chip with Family metadata and excludes locked Nightglass', async () => {
    const user = userEvent.setup()
    renderBestiary()
    await user.click(screen.getByRole('tab', { name: 'CONTRACT TARGETS' }))
    await user.click(screen.getByRole('button', { name: 'Filter by family' }))
    await user.click(screen.getByRole('option', { name: 'Gloamridge Predators' }))
    expect(screen.getAllByRole('button', { name: /Veilwing Harrier/ }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /Nightglass Alpha/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'CLEAR FILTERS' })).toBeTruthy()
  })

  it('groups the Hunter quarry index by Ground and changes the dossier when a tile is selected', async () => {
    const state = useGameStore.getState()
    state.progress.discoveredMonsters = ['gloamfang-stalker', 'ashen-tracker', 'runehorn-brute', 'veilwing-harrier', 'cinderback-mauler', 'gloomroot-hexer', 'nightglass-alpha']
    useGameStore.setState(state)
    const user = userEvent.setup()
    const { container } = renderBestiary()
    await user.click(screen.getByRole('tab', { name: 'HUNTER QUARRY' }))
    expect(screen.getByText('Gloamridge', { selector: '.hunter-quarry-ground-group > header > strong' })).toBeTruthy()
    expect(container.querySelectorAll('.hunter-quarry-tile-grid .hunter-quarry-tile')).toHaveLength(7)
    await user.click(screen.getByRole('button', { name: /Ashen Tracker/ }))
    expect(screen.getByRole('heading', { name: 'Ashen Tracker' })).toBeTruthy()
  })

  it('writes Quarry Memory only after the explicit Hunt in Ground action', async () => {
    act(() => useGameStore.getState().debugGrantHunterUpgrade('quarry-memory'))
    const user = userEvent.setup()
    renderBestiary()
    await user.click(screen.getByRole('tab', { name: 'HUNTER QUARRY' }))
    await user.click(screen.getByRole('button', { name: /Veilwing Harrier/ }))
    expect(useGameStore.getState().progress.huntersOrder.lastSelectedQuarryByGround?.['hunters-ground']).toBeUndefined()
    await user.click(screen.getAllByRole('button', { name: 'HUNT IN GLOAMRIDGE' })[0])
    expect(useGameStore.getState().progress.huntersOrder.lastSelectedQuarryByGround?.['hunters-ground']).toBe('veilwing-harrier')
  })

  it('shows the four structured dossier sections and reveals combat content only in Combat', async () => {
    const user = userEvent.setup()
    renderBestiary()
    expect(screen.getByRole('tab', { name: 'OVERVIEW' })).toBeTruthy()
    expect(screen.getByText('CLASSIFICATION')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: 'COMBAT' }))
    expect(screen.getByText('COMBAT PROFILE')).toBeTruthy()
    expect(screen.getByText('DEFENCES')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: 'REWARDS' }))
    expect(screen.getByText('ITEM LOOT')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: 'HUNTER RECORD' }))
    expect(screen.getByText('CONTRACT KILLS')).toBeTruthy()
  })

  it('OPEN CONTRACTS selects the Contracts tab before navigating', async () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    useGameStore.setState(state)
    const setScreen = vi.spyOn(useGameStore.getState(), 'setScreen')
    const user = userEvent.setup()
    renderBestiary()
    await user.click(screen.getByRole('button', { name: 'OPEN CONTRACTS' }))
    expect(getUiPreferences().screenState.huntersOrder.activeTab).toBe('contracts')
    expect(setScreen).toHaveBeenCalledWith('hunters-order')
  })

  it('opens Hunter Bestiary and selects the requested creature from a deep link', () => {
    const state = createInitialState()
    state.progress.discoveredMonsters = ['veilwing-harrier']
    useGameStore.setState(state)
    setNavigationIntent({ combatDungeonId: null, combatMonsterId: null })
    openHunterBestiaryEntry('veilwing-harrier')
    renderBestiary()
    expect(screen.getByRole('heading', { name: 'Veilwing Harrier' })).toBeTruthy()
    expect(getUiPreferences().screenState.huntersOrder.activeTab).toBe('bestiary')
  })

  it('blocks and unblocks a future target through the existing Hunter action', async () => {
    act(() => useGameStore.getState().debugGrantHunterUpgrade('extended-trails'))
    const user = userEvent.setup()
    renderBestiary()
    await user.click(screen.getByRole('button', { name: /Cinderback Mauler/ }))
    await user.click(screen.getByRole('tab', { name: 'HUNTER RECORD' }))
    const block = screen.getByRole('button', { name: 'BLOCK FROM FUTURE CONTRACTS' })
    await user.click(block)
    expect(useGameStore.getState().progress.huntersOrder.blockedTargets).toContain('cinderback-mauler')
    await user.click(screen.getByRole('button', { name: 'UNBLOCK QUARRY' }))
    expect(useGameStore.getState().progress.huntersOrder.blockedTargets).not.toContain('cinderback-mauler')
  })

  it('supports a back-to-index flow on a narrow viewport', () => {
    const media = vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('760px'), media: query, addEventListener: () => undefined, removeEventListener: () => undefined }))
    try {
      const state = createInitialState()
      state.progress.discoveredMonsters = ['veilwing-harrier']
      useGameStore.setState(state)
      renderBestiary()
      fireEvent.click(screen.getByRole('button', { name: /Veilwing Harrier/ }))
      expect(screen.getByRole('button', { name: 'BACK TO QUARRY INDEX' })).toBeTruthy()
    } finally { vi.unstubAllGlobals(); void media }
  })
})
