import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { resetAllUiPreferences, setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { GuildScreen } from './GuildScreen'

const renderGuild = () => render(<TooltipProvider><GuildScreen /></TooltipProvider>)

describe('Guild V4 screen', () => {
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

  it('keeps a legacy Collection route browsable while registration remains locked', async () => {
    const user = userEvent.setup()
    useGameStore.setState((state) => { state.inventory['fire-fragment'] = 1 })
    setUiPreferences({ screenState: { guild: { activeTab: 'registry' } } })
    renderGuild()

    expect(screen.getByRole('heading', { name: 'Registry archive' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Registry Catalog' })).toBeTruthy()
    expect(screen.getByText(/Browsing only/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Fire Fragment/ }))
    expect((screen.getByRole('button', { name: 'Guild Locked' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('switches among Registry, Commissions, Standing, and Advancement without changing gameplay state', async () => {
    const user = userEvent.setup()
    useGameStore.setState((state) => { state.progress.guildUnlocked = true; state.progress.guildRank = 'initiate'; state.progress.guildPointsEarned = 1; state.progress.arcaneGuild.availableCommissions = [{ id: 'test-supply', templateId: 'supply-life-essence', category: 'supply', quality: 'routine', objectives: [{ kind: 'item-supply', itemId: 'life-essence', target: 10, progress: 0 }], reputationReward: 60, advancementPointReward: 0 }] })
    renderGuild()

    expect(screen.getByRole('heading', { name: 'Initiate I' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Commission Board' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /^Commissions/ }))
    expect(screen.getByRole('heading', { name: 'Choose a Commission' })).toBeTruthy()
    expect(screen.getByText('Available Commissions')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Accept Commission' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Registry' }))
    expect(screen.getByRole('heading', { name: 'Registry Catalog' })).toBeTruthy()
    expect(screen.getByText('ARCANE REGISTRY')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Advancement' }))
    expect(screen.getByRole('heading', { name: 'Advancement Catalog' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Measured Inquiry' })).toBeTruthy()
    expect(useGameStore.getState().progress.guildPointsEarned).toBe(1)
  })

  it('keeps current Guild interface copy aligned with the Arcane Guild and Advancement Board', () => {
    useGameStore.setState((state) => { state.progress.guildUnlocked = true; state.progress.guildRank = 'initiate' })
    renderGuild()
    const visibleCopy = document.body.textContent ?? ''
    expect(visibleCopy).toContain('ARCANE GUILD')
    expect(visibleCopy).toContain('Guild Standing')
    expect(visibleCopy).toContain('Next Initiate II')
    expect(visibleCopy).toContain('STANDING PROGRESS')
    expect(visibleCopy).not.toMatch(/Verdant Circle|specialization tier|next sigil/i)
  })
})
