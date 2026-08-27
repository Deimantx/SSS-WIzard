import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { FocusScreen } from './FocusScreen'

describe('Focus screen', () => {
  beforeEach(() => useGameStore.getState().hydrateState(createInitialState()))

  it('renders the overview, usage, and improvement panels', () => {
    render(<TooltipProvider><FocusScreen /></TooltipProvider>)
    expect(screen.getByRole('heading', { name: 'FOCUS OVERVIEW' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'ACTIVE FOCUS USAGE' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'FOCUS IMPROVEMENT' })).toBeTruthy()
    expect(screen.getByText('FOCUS LOAD')).toBeTruthy()
    expect(screen.getByText('AVAILABLE CAPACITY')).toBeTruthy()
    expect(screen.getAllByText('CHANNELING').length).toBeGreaterThan(0)
    expect(screen.getByText('RESEARCH')).toBeTruthy()
    expect(screen.getByText('TRANSMUTATION')).toBeTruthy()
    expect(screen.getByText('AUTO-CAST')).toBeTruthy()
  })

  it('shows one Prismatic requirement and the +5 progression', () => {
    const state = createInitialState()
    state.progress.focusImprovement.level = 4
    state.inventory['prismatic-fragment'] = 32
    useGameStore.getState().hydrateState(state)
    render(<TooltipProvider><FocusScreen /></TooltipProvider>)
    expect(screen.getByText('LEVEL 4 / 10')).toBeTruthy()
    expect(document.body.textContent).toContain('+20 Max Focus')
    expect(document.body.textContent).toContain('+25 Max Focus')
    expect(screen.getByRole('img', { name: /Prismatic Fragment, 32 available, 40 required/ })).toBeTruthy()
    expect(screen.queryByRole('img', { name: /Life Essence/ })).toBeNull()
  })

  it('navigates a research reservation to the Research screen', async () => {
    const user = userEvent.setup()
    const state = createInitialState()
    state.inventory['fire-fragment'] = 10
    state.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 1, remainingQuantity: 1, progressMs: 0, echoesAssigned: 1, status: 'running' }
    useGameStore.getState().hydrateState(state)
    render(<TooltipProvider><FocusScreen /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: /Research · Fire Fragment/ }))
    expect(useGameStore.getState().ui.screen).toBe('tower-research')
  })
})
