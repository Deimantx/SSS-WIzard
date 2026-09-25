import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { prepareResearchAction, setResearchEchoesAction } from '../../../store/actions/researchActions'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { PreparedResearch } from './PreparedResearch'

describe('PreparedResearch', () => {
  beforeEach(() => { useGameStore.getState().resetSave(); resetAllUiPreferences() })

  it('renders four stable rows and distributes the five-Echo pool', () => {
    const state = createInitialState()
    ;(['fire', 'water', 'earth', 'air'] as const).forEach((school, index) => {
      state.inventory[`${school}-fragment`] = 10
      prepareResearchAction(state, `${school}-fragment` as never, school, 5)
      setResearchEchoesAction(state, `research-${index + 1}` as never, index === 0 ? 2 : 1)
    })
    useGameStore.getState().hydrateState(state)
    render(<TooltipProvider><PreparedResearch /></TooltipProvider>)

    expect(document.querySelectorAll('.prepared-research-row')).toHaveLength(4)
    expect(screen.getByText('4 / 4')).toBeTruthy()
    expect(screen.getByText('5 / 5 ECHOES')).toBeTruthy()
    expect((screen.getByRole('button', { name: /Assign Research Echo to Air Fragment/ }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /Remove Research Echo from Fire Fragment/ }))
    expect(useGameStore.getState().activities.research.slots['research-1']?.echoesAssigned).toBe(1)
    expect(screen.getByText('4 / 5 ECHOES')).toBeTruthy()
    expect(document.querySelectorAll('.game-tooltip-trigger').length).toBeGreaterThan(0)
  })

  it('renders compact live metrics and keeps exact values behind expansion', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 10
    state.player.baseMaxFocus = 10
    state.player.maxFocus = 10
    prepareResearchAction(state, 'fire-fragment', 'fire', 5)
    setResearchEchoesAction(state, 'research-1' as never, 1)
    useGameStore.getState().hydrateState(state)
    render(<TooltipProvider><PreparedResearch /></TooltipProvider>)

    expect(screen.getByLabelText(/items per hour/)).toBeTruthy()
    expect(screen.queryByText('XP REMAINING')).toBeNull()
    expect(screen.queryByText('EST. NEXT LEVEL')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Show Research batch details' }))
    expect(screen.getByText('XP REMAINING')).toBeTruthy()
    expect(screen.getByText('EST. NEXT LEVEL')).toBeTruthy()
    expect(screen.getByText('SCHOOL XP')).toBeTruthy()
    expect(screen.getByText('FOCUS RESERVED')).toBeTruthy()
    expect((screen.getByRole('button', { name: /Assign Research Echo to Fire Fragment/ }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('keeps only one research batch expanded at a time', () => {
    const state = createInitialState()
    ;(['fire', 'water'] as const).forEach((school) => {
      state.inventory[`${school}-fragment`] = 10
      prepareResearchAction(state, `${school}-fragment` as never, school, 5)
    })
    useGameStore.getState().hydrateState(state)
    render(<TooltipProvider><PreparedResearch /></TooltipProvider>)

    const expanders = screen.getAllByRole('button', { name: 'Show Research batch details' })
    fireEvent.click(expanders[0])
    expect(expanders[0].getAttribute('aria-pressed')).toBe('true')
    const secondExpander = screen.getAllByRole('button', { name: 'Show Research batch details' })[0]
    fireEvent.click(secondExpander)
    expect(screen.getAllByRole('button', { name: 'Hide Research batch details' })).toHaveLength(1)
    expect(document.querySelectorAll('.prepared-research-row-details')).toHaveLength(1)
  })
})
