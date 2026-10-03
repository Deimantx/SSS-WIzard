import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { GameContextMenuProvider } from '../../ui/context-menu/GameContextMenuProvider'
import { setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../store/gameStore'
import { createInitialState } from '../../store/initialState'
import { HuntersOrderScreen } from './HuntersOrderScreen'
import { HUNTER_EXCLUSIVE_MONSTER_IDS } from '../../game/content/monsters'

const renderScreen = () => render(<TooltipProvider><GameContextMenuProvider><HuntersOrderScreen /></GameContextMenuProvider></TooltipProvider>)

describe('Hunter’s Order locked shell', () => {
  beforeEach(() => {
    useGameStore.setState(createInitialState())
    setUiPreferences({ screenState: { huntersOrder: { activeTab: 'contracts' } } })
  })

  it('opens Bestiary from a fresh save and keeps other Order tabs locked', () => {
    renderScreen()

    expect(screen.getAllByRole('heading', { name: 'FIELD INTELLIGENCE' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('region', { name: 'Field Intelligence' })).toBeTruthy()
    expect(screen.getByText(`0 / ${HUNTER_EXCLUSIVE_MONSTER_IDS.length}`)).toBeTruthy()
    expect(screen.getAllByText('HUNTER QUARRY').length).toBeGreaterThan(0)
    expect(screen.queryByRole('tab', { name: 'Hunting Grounds' })).toBeNull()
    expect(screen.getByRole('tab', { name: 'Bestiary' }).getAttribute('aria-selected')).toBe('true')
    expect((screen.getByRole('tab', { name: 'Contracts' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('tab', { name: 'Order Rank' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/Defeat Corrupted Greatbear to unlock/)).toBeTruthy()
  })

  it('unlocks the full Order navigation after Corrupted Greatbear', async () => {
    const user = userEvent.setup()
    renderScreen()
    act(() => useGameStore.getState().debugSetHuntersOrderUnlocked(true))

    expect((screen.getByRole('tab', { name: 'Contracts' }) as HTMLButtonElement).disabled).toBe(false)
    await user.click(screen.getByRole('tab', { name: 'Contracts' }))
    expect(screen.getByText('TRACKER DISPATCH')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /REQUEST FIRST ASSIGNMENT/i }))
    expect(useGameStore.getState().progress.huntersOrder.activeContract).not.toBeNull()
    expect(screen.getByText(/ROUTINE · ACTIVE CONTRACT/)).toBeTruthy()
  })

  it('hides Target Blocks until unlocked and lists all eligible quarry afterward', async () => {
    const user = userEvent.setup()
    renderScreen()
    act(() => useGameStore.getState().debugSetHuntersOrderUnlocked(true))
    expect(screen.queryByText('TARGET BLOCKS')).toBeNull()
    act(() => {
      useGameStore.getState().debugSetHunterRank('stalker')
      useGameStore.getState().debugGrantHunterUpgrade('extended-trails')
    })
    expect(useGameStore.getState().progress.huntersOrder.blockedTargets).toEqual([])
    await user.click(screen.getByRole('button', { name: /TARGET BLOCKS/i }))
    expect(screen.getByRole('region', { name: 'Blockable targets' })).toBeTruthy()
    expect(screen.getAllByText('Ashen Tracker').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Gloamfang Stalker').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Runehorn Brute').length).toBeGreaterThan(0)
    await user.click(screen.getAllByRole('button', { name: /^BLOCK$/i })[0])
    expect(useGameStore.getState().progress.huntersOrder.blockedTargets).toHaveLength(1)
  })

  it('makes an accepted contract the primary state and exposes the hunting ground action', async () => {
    const user = userEvent.setup()
    renderScreen()
    act(() => useGameStore.getState().debugSetHunterRank('scout'))
    await user.click(screen.getByRole('tab', { name: 'Contracts' }))
    const accept = screen.getAllByRole('button', { name: /ACCEPT CONTRACT/i })[0]
    await user.click(accept)

    expect(screen.getByRole('heading', { name: 'Current Contract' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /OPEN GROUND/i }).length).toBeGreaterThan(0)
  })

  it('shows the Order overview as a useful dispatch surface and routes its CTA to Contracts', async () => {
    const user = userEvent.setup()
    renderScreen()
    act(() => useGameStore.getState().debugSetHuntersOrderUnlocked(true))
    await user.click(screen.getByRole('tab', { name: 'Overview' }))
    expect(screen.getByRole('heading', { name: 'Hunter’s Order' })).toBeTruthy()
    expect(screen.getByText('Dispatch is ready.')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'OPEN CONTRACT BOARD' }))
    expect(screen.getByRole('tab', { name: 'Contracts' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('button', { name: 'REQUEST FIRST ASSIGNMENT' })).toBeTruthy()
  })

  it('renders a selectable rank ladder using authored thresholds and unlocks', async () => {
    const user = userEvent.setup()
    renderScreen()
    act(() => useGameStore.getState().debugSetHunterRank('stalker'))
    await user.click(screen.getByRole('tab', { name: 'Order Rank' }))
    expect(screen.getAllByRole('heading', { name: 'Stalker' }).length).toBeGreaterThan(0)
    expect(screen.getByText('4,000 / 5,000 Reputation')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Warden/ }))
    expect(screen.getByText('9,000 Reputation')).toBeTruthy()
    expect(screen.getAllByText('Region Contracts').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Order Privilege').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /Stalker/ }))
    await user.click(screen.getByRole('button', { name: /Stalker III/ }))
    expect(screen.getAllByText('Deep Pockets').length).toBeGreaterThan(0)
  })

  it('presents upgrade effects and rank locks in the Order services catalog', async () => {
    const user = userEvent.setup()
    renderScreen()
    act(() => {
      useGameStore.getState().debugSetHunterRank('stalker')
      useGameStore.getState().debugGrantHunterUpgrade('trail-kit')
      useGameStore.getState().debugGrantHunterUpgrade('trail-kit')
      useGameStore.getState().debugGrantHunterUpgrade('trail-kit')
    })
    await user.click(screen.getByRole('tab', { name: 'Upgrades' }))

    expect(screen.getByRole('heading', { name: 'Hunter Mark Catalog' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Trail Kit/ }))
    expect(screen.getByRole('heading', { name: 'Trail Kit' })).toBeTruthy()
    expect(screen.getAllByText(/Monster Contracts .6%/).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /Deep Pockets/ }))
    expect(screen.getByRole('heading', { name: 'Deep Pockets' })).toBeTruthy()
    expect(screen.getByText('Current Standing: Stalker I.')).toBeTruthy()
  })

  it('includes Nightglass as a normal Gloamridge quarry in the shared Bestiary', () => {
    const state = createInitialState()
    state.progress.discoveredMonsters.push('nightglass-alpha')
    useGameStore.setState(state)
    renderScreen()
    expect(screen.getAllByText('Nightglass Alpha').length).toBeGreaterThan(0)
    expect(screen.queryByText('APEX HUNT')).toBeNull()
  })
})
