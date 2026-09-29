import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { GameContextMenuProvider } from '../../ui/context-menu/GameContextMenuProvider'
import { setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../store/gameStore'
import { createInitialState } from '../../store/initialState'
import { HuntersOrderScreen } from './HuntersOrderScreen'

const renderScreen = () => render(<TooltipProvider><GameContextMenuProvider><HuntersOrderScreen /></GameContextMenuProvider></TooltipProvider>)

describe('Hunter’s Order locked shell', () => {
  beforeEach(() => {
    useGameStore.setState(createInitialState())
    setUiPreferences({ screenState: { huntersOrder: { activeTab: 'contracts' } } })
  })

  it('opens Bestiary from a fresh save and keeps other Order tabs locked', () => {
    renderScreen()

    expect(screen.getByRole('heading', { name: 'BESTIARY INDEX' })).toBeTruthy()
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
    expect(screen.getByText('WELCOME TO THE ORDER')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Receive First Contract' }))
    expect(useGameStore.getState().progress.huntersOrder.activeContract).not.toBeNull()
    expect(screen.getByText('FIRST ASSIGNMENT')).toBeTruthy()
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
    await user.click(screen.getByRole('button', { name: 'Manage Blocks' }))
    expect(screen.getByRole('region', { name: 'Blockable targets' })).toBeTruthy()
    expect(screen.getAllByText('Ashen Tracker').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Gloamfang Stalker').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Runehorn Brute').length).toBeGreaterThan(0)
    await user.click(screen.getAllByRole('button', { name: 'Block' })[0])
    expect(useGameStore.getState().progress.huntersOrder.blockedTargets).toHaveLength(1)
  })

  it('makes an accepted contract the primary state and exposes the hunting ground action', async () => {
    const user = userEvent.setup()
    renderScreen()
    act(() => useGameStore.getState().debugSetHunterRank('scout'))
    await user.click(screen.getByRole('tab', { name: 'Contracts' }))
    const accept = screen.getAllByRole('button', { name: 'Accept Contract' })[0]
    await user.click(accept)

    expect(screen.getByRole('heading', { name: 'First assignment' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Open Gloamridge/ })).toBeTruthy()
  })
})
