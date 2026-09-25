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
    expect(screen.getByRole('heading', { name: 'ACTIVE FOCUS ALLOCATION' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'FOCUS IMPROVEMENT' })).toBeTruthy()
    expect(screen.getByText('FOCUS LOAD')).toBeTruthy()
    expect(screen.getByText('AVAILABLE CAPACITY')).toBeTruthy()
    expect(screen.getAllByText('CHANNELING').length).toBeGreaterThan(0)
    expect(screen.getByText('RESEARCH')).toBeTruthy()
    expect(screen.getByText('TRANSMUTATION')).toBeTruthy()
    expect(screen.getByText('Combat Auto-Cast')).toBeTruthy()
    expect(screen.getByText('0 Focus')).toBeTruthy()
    expect(screen.getByText(/0% · INACTIVE/)).toBeTruthy()
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
    expect(screen.getByRole('img', { name: /Prismatic Fragment, 32 available, 160 required/ })).toBeTruthy()
    expect(screen.queryByRole('img', { name: /Life Essence/ })).toBeNull()
  })

  it('shows a prepared Combat projection without adding it to active Focus totals', () => {
    const state = createInitialState()
    state.progress.spellRanks['fire-bolt'] = 1
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Prepared Burst', slots: [{ spellId: 'fire-bolt', autoCast: true }] }]
    state.spellPresets.selectedPresetId = 'spell-preset-1'
    useGameStore.getState().hydrateState(state)
    render(<TooltipProvider><FocusScreen /></TooltipProvider>)

    expect(screen.getByText('Combat Auto-Cast')).toBeTruthy()
    expect(screen.getByText(/10 Focus/)).toBeTruthy()
    expect(screen.getByText(/10% · INACTIVE/)).toBeTruthy()
    expect(screen.queryByText('Prepared Burst')).toBeNull()
    expect(screen.queryByText('Fire Bolt')).toBeNull()
  })

  it('does not expose spell names in the Combat Auto-Cast projection', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1, 'mending-waters': 1, 'wind-blade': 1 }
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Mixed Modes', slots: [
      { spellId: 'fire-bolt', autoCast: true },
      { spellId: 'mending-waters', autoCast: false },
      { spellId: 'wind-blade', autoCast: true },
    ] }]
    state.spellPresets.selectedPresetId = 'spell-preset-1'
    useGameStore.getState().hydrateState(state)
    render(<TooltipProvider><FocusScreen /></TooltipProvider>)

    expect(screen.getByText('Combat Auto-Cast')).toBeTruthy()
    expect(screen.getByText(/20 Focus/)).toBeTruthy()
    expect(screen.queryByText('Fire Bolt')).toBeNull()
    expect(screen.queryByText('Wind Blade')).toBeNull()
    expect(screen.queryByText('Mending Waters')).toBeNull()
  })

  it('navigates a research reservation to the Research screen', async () => {
    const user = userEvent.setup()
    const state = createInitialState()
    state.inventory['fire-fragment'] = 10
    state.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 1, remainingQuantity: 1, progressMs: 0, echoesAssigned: 1, status: 'running' }
    useGameStore.getState().hydrateState(state)
    render(<TooltipProvider><FocusScreen /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: /Research Allocation/ }))
    expect(useGameStore.getState().ui.screen).toBe('tower-research')
  })
})
