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
    expect(screen.getByRole('heading', { name: 'Choose a contract' })).toBeTruthy()
  })
})
