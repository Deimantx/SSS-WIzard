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
    expect(screen.getByText(/ITEM SLOTS 4 \/ 4/)).toBeTruthy()
    expect(screen.getByText(/ECHOES 5 \/ 5/)).toBeTruthy()
    expect((screen.getByRole('button', { name: /Assign Research Echo to Air Fragment/ }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /Remove Research Echo from Fire Fragment/ }))
    expect(useGameStore.getState().activities.research.slots['research-1']?.echoesAssigned).toBe(1)
    expect(screen.getByText(/ECHOES 4 \/ 5/)).toBeTruthy()
    expect(document.querySelectorAll('.game-tooltip-trigger').length).toBeGreaterThan(0)
  })

  it('renders live metrics and disables Echo assignment without free Focus', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 10
    state.player.baseMaxFocus = 10
    state.player.maxFocus = 10
    prepareResearchAction(state, 'fire-fragment', 'fire', 5)
    setResearchEchoesAction(state, 'research-1' as never, 1)
    useGameStore.getState().hydrateState(state)
    render(<TooltipProvider><PreparedResearch /></TooltipProvider>)

    expect(screen.getByText('ITEMS / H')).toBeTruthy()
    expect(screen.getByText('MANA / S')).toBeTruthy()
    expect(screen.getByText('XP / H')).toBeTruthy()
    expect(screen.getByText('XP REMAINING')).toBeTruthy()
    expect(screen.getAllByText(/SCHOOL PROGRESS/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/EST\. NEXT LEVEL/).length).toBeGreaterThan(0)
    expect((screen.getByRole('button', { name: /Assign Research Echo to Fire Fragment/ }) as HTMLButtonElement).disabled).toBe(true)
  })
})
