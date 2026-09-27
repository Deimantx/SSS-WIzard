import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { resetAllUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { GuildScreen } from './GuildScreen'

const renderGuild = () => render(<TooltipProvider><GuildScreen /></TooltipProvider>)

describe('Guild V3 screen', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.setState(createInitialState())
    resetAllUiPreferences()
  })

  it('renders the sealed invitation with the Forest Heart gate', () => {
    renderGuild()
    expect(screen.getByRole('heading', { name: 'Invitation Sealed' })).toBeTruthy()
    expect(screen.getByText('FOREST HEART')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Open Combat/ })).toBeTruthy()
  })

  it('switches between Overview, Contracts, and Skill Tree without changing gameplay state', async () => {
    const user = userEvent.setup()
    useGameStore.setState((state) => { state.progress.guildUnlocked = true; state.progress.guildRank = 'initiate'; state.progress.guildPointsEarned = 1 })
    renderGuild()

    expect(screen.getByRole('heading', { name: 'Recommended contracts' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /^Contracts/ }))
    expect(screen.getByRole('heading', { name: 'Active contracts' })).toBeTruthy()
    expect(screen.getByText('Field Supplies')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /^Skill Tree/ }))
    expect(screen.getByRole('heading', { name: 'Skill tree' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Hunter' })).toBeTruthy()
    expect(useGameStore.getState().progress.guildPointsEarned).toBe(1)
  })
})
