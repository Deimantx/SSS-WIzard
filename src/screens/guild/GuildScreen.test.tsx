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

  it('switches between Guild-owned Registry, Commissions, and Advancement without changing gameplay state', async () => {
    const user = userEvent.setup()
    useGameStore.setState((state) => { state.progress.guildUnlocked = true; state.progress.guildRank = 'initiate'; state.progress.guildPointsEarned = 1; state.progress.arcaneGuild.availableCommissions = [{ id: 'test-delivery', templateId: 'deliver-life-essence-small', category: 'delivery', quality: 'routine', itemId: 'life-essence', target: 8, progress: 0, reputationReward: 45, advancementPointReward: 0 }] })
    renderGuild()

    expect(screen.getByRole('heading', { name: 'Noncombat commissions' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Guild progression' })).toBeTruthy()
    expect(screen.getByText('RANK PROGRESS')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /^Contracts/ }))
    expect(screen.getByRole('heading', { name: 'Choose a commission' })).toBeTruthy()
    expect(screen.getByText('Available commissions')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Accept Commission' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Registry' }))
    expect(screen.getByRole('heading', { name: 'Items to register' })).toBeTruthy()
    expect(screen.getByText('ARCANE REGISTRY')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Advancement' }))
    expect(screen.getByRole('heading', { name: 'Advancement Board' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Research' })).toBeTruthy()
    expect(useGameStore.getState().progress.guildPointsEarned).toBe(1)
  })
})
