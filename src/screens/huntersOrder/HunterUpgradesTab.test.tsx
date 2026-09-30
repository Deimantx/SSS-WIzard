import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { HunterUpgradesTab } from './HunterUpgradesTab'

describe('Hunter upgrade catalog inspector', () => {
  it('keeps locked upgrade values and planning details visible', async () => {
    const state = createInitialState()
    useGameStore.setState(state)
    const user = userEvent.setup()
    render(<TooltipProvider><HunterUpgradesTab state={state} /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: /Exact Quarry Briefing/ }))
    expect(screen.getByText('PER RANK EFFECT')).toBeTruthy()
    expect(screen.getByText('RANK UNLOCKS')).toBeTruthy()
    expect(screen.getByText('CURRENT EFFECT')).toBeTruthy()
    expect(screen.getByText('NEXT RANK')).toBeTruthy()
    expect(screen.getByText('MAX EFFECT')).toBeTruthy()
    expect(screen.getByText('COST')).toBeTruthy()
    expect(screen.getByText('REQUIRED STANDING')).toBeTruthy()
    expect(screen.getByText('STATUS')).toBeTruthy()
    expect(screen.getAllByText(/Monster Contracts .2%/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'LOCKED' })).toBeTruthy()
  })

  it('shows complete rank, runtime values, and cost in a keyboard-triggered tile tooltip', async () => {
    const state = createInitialState()
    state.progress.huntersOrder.reputation = 9_000
    state.progress.huntersOrder.purchasedUpgrades['negotiated-rerolls'] = 2
    useGameStore.setState(state)
    const user = userEvent.setup()
    render(<TooltipProvider><HunterUpgradesTab state={state} /></TooltipProvider>)
    await user.tab()
    const tile = screen.getByRole('button', { name: /Negotiated Rerolls/ })
    tile.focus()
    expect(await screen.findByText(/NEXT RANK COST \/ .* HUNTER MARKS/)).toBeTruthy()
    expect(screen.getByText(/CURRENT \/ 2 Hunter Mark refresh cost/)).toBeTruthy()
    expect(screen.getByText(/MAX \/ 1 Hunter Mark refresh cost/)).toBeTruthy()
  })
})
