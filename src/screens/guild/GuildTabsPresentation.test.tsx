import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { GuildRecommendedContracts, GuildAdvancementSummary } from './GuildOverviewTab'
import { GuildContractsBoard } from './GuildContractsTab'
import { ArcaneRegistryTab } from './ArcaneRegistryTab'

const prepareGuild = () => {
  useGameStore.setState(createInitialState())
  const actions = useGameStore.getState()
  actions.addItem('life-essence', 20)
  actions.setTutorialStageForDebug('complete')
  actions.debugSetArcaneGuildUnlocked(true)
  actions.debugRegenerateGuildCommissionBoard()
  return useGameStore.getState()
}

describe('Arcane Guild presentations', () => {
  beforeEach(() => { prepareGuild() })

  it('prioritizes an active Commission and shows advancement metrics on Overview', () => {
    const boardState = useGameStore.getState()
    const offer = boardState.progress.arcaneGuild.availableCommissions[0]
    expect(offer).toBeTruthy()
    expect(boardState.acceptGuildCommission(offer.id)).toBe(true)
    const state = useGameStore.getState()
    const navigate = vi.fn()
    render(<><GuildRecommendedContracts state={state} onNavigate={navigate} /><GuildAdvancementSummary state={state} onNavigate={navigate} /></>)

    expect(screen.getByText('ACTIVE COMMISSION')).toBeTruthy()
    expect(screen.getByText(/SUPPLY.*0.*10/)).toBeTruthy()
    expect(screen.getByText('AVAILABLE')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Open Advancement Board' }))
    expect(navigate).toHaveBeenCalledWith('advancement')
  })

  it('shows compact Commission offers and updates to the active-work state after acceptance', () => {
    const view = render(<GuildContractsBoard state={useGameStore.getState()} />)
    const firstOfferTitle = useGameStore.getState().progress.arcaneGuild.availableCommissions[0].id
    expect(screen.getByText('Available Commissions')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Accept Commission' })[0])
    expect(useGameStore.getState().progress.arcaneGuild.activeCommission?.id).toBe(firstOfferTitle)
    view.rerender(<GuildContractsBoard state={useGameStore.getState()} />)
    expect(screen.getByText('ACTIVE COMMISSION')).toBeTruthy()
    expect(screen.getByText('Other available offers')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Commission Active' }).length).toBeGreaterThan(0)
  })

  it('masks undiscovered records, lets selection inspect without registering, and registers only on explicit action', () => {
    const fixture = createInitialState()
    fixture.progress.guildUnlocked = true
    fixture.inventory['fire-fragment'] = 5
    fixture.progress.discoveredItems = ['fire-fragment']
    useGameStore.setState(fixture)
    const state = useGameStore.getState()
    render(<ArcaneRegistryTab />)

    expect(screen.getAllByRole('button', { name: /Undiscovered Registry Entry, catalog position/ }).length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toContain('Water Fragment')
    fireEvent.change(screen.getByRole('textbox', { name: 'Search Arcane Registry' }), { target: { value: 'Fire Fragment' } })
    const tile = screen.getByRole('button', { name: /Fire Fragment/ })
    fireEvent.click(tile)
    expect(state.inventory['fire-fragment']).toBe(5)
    expect(screen.getAllByText('Fire Fragment').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Register Item' }))
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(4)
    expect(useGameStore.getState().progress.arcaneRegistry.registeredEntries['fire-fragment']).toBe(1)
  })
})
