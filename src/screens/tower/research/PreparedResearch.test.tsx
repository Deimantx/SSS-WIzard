import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { prepareResearchAction } from '../../../store/actions/researchActions'
import { BALANCE } from '../../../game/core/balance/balance'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { PreparedResearch } from './PreparedResearch'

describe('PreparedResearch', () => {
  beforeEach(() => { useGameStore.getState().resetSave(); resetAllUiPreferences() })

  it('renders four stable rows and distributes the five-Echo pool', () => {
    const state = createInitialState()
    ;(['fire', 'water', 'earth', 'air'] as const).forEach((school, index) => {
      state.inventory[`${school}-fragment`] = 10
      prepareResearchAction(state, `${school}-fragment` as never, school, 5)
      const slotId = `research-${index + 1}` as keyof typeof state.activities.research.slots
      state.activities.research.slots[slotId]!.acolyteAssigned = true
    })
    useGameStore.getState().hydrateState(state)
    render(<TooltipProvider><PreparedResearch /></TooltipProvider>)

    expect(document.querySelectorAll('.prepared-research-row')).toHaveLength(4)
    expect(screen.getByText('4 / 4')).toBeTruthy()
    expect(screen.getByLabelText('4 Research Acolytes assigned')).toBeTruthy()
    expect(Array.from(document.querySelectorAll('.prepared-research-compact-progress .progress > i')).map((fill) => fill.className)).toEqual(['violet', 'fire', 'violet', 'water', 'violet', 'earth', 'violet', 'air'])
    expect((screen.getByRole('button', { name: /Assign Research Acolyte to Air Fragment/ }) as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: /Remove Research Acolyte from Fire Fragment/ }))
    expect(useGameStore.getState().activities.research.slots['research-1']?.acolyteAssigned).toBe(false)
    expect(screen.getByLabelText('3 Research Acolytes assigned')).toBeTruthy()
    expect(document.querySelectorAll('.game-tooltip-trigger').length).toBeGreaterThan(0)
  })

  it('renders compact live metrics and keeps exact values behind expansion', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 10
    state.player.baseMaxFocus = 10
    state.player.maxFocus = 10
    prepareResearchAction(state, 'fire-fragment', 'fire', 5)
    state.activities.research.slots['research-1']!.acolyteAssigned = true
    useGameStore.getState().hydrateState(state)
    render(<TooltipProvider><PreparedResearch /></TooltipProvider>)

    expect(screen.getByLabelText(/items per hour/)).toBeTruthy()
    expect(screen.queryByText('XP REMAINING')).toBeNull()
    expect(screen.queryByText('EST. NEXT LEVEL')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Show Research batch details' }))
    expect(screen.getByText('XP REMAINING')).toBeTruthy()
    expect(screen.getByText('EST. NEXT LEVEL')).toBeTruthy()
    expect(screen.getByText('SCHOOL XP')).toBeTruthy()
    expect(screen.getByLabelText(/minus 0\.5 Arcane Flux per second/)).toBeTruthy()
    expect((screen.getByRole('button', { name: /Assign Research Acolyte to Fire Fragment/ }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('keeps current-item and school-level progress bars visible with their real values', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 10
    prepareResearchAction(state, 'fire-fragment', 'fire', 5)
    state.activities.research.slots['research-1']!.progressMs = BALANCE.research.durationPerItemMs * 0.22
    state.schools.fire.xp = 24
    useGameStore.getState().hydrateState(state)
    render(<TooltipProvider><PreparedResearch /></TooltipProvider>)

    const groups = screen.getAllByRole('group')
    expect(groups.find((group) => group.getAttribute('aria-label') === 'Current Research item progress: 22%')).toBeTruthy()
    expect(groups.find((group) => group.getAttribute('aria-label') === 'Fire school level progress: 24%')).toBeTruthy()
    const fills = Array.from(document.querySelectorAll('.prepared-research-compact-progress .progress > i')) as HTMLElement[]
    expect(fills).toHaveLength(2)
    expect(fills[0].style.width).toBe('22%')
    expect(fills[1].style.width).toBe('24%')
  })

  it('keeps school progress visibly full and labels the school cap', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 10
    state.progress.magicLevelCap = 1
    state.schools.fire.level = 1
    prepareResearchAction(state, 'fire-fragment', 'fire', 5)
    useGameStore.getState().hydrateState(state)
    render(<TooltipProvider><PreparedResearch /></TooltipProvider>)

    expect(screen.getByRole('group', { name: 'Fire school level progress: CAP' })).toBeTruthy()
    const schoolFill = document.querySelectorAll('.prepared-research-compact-progress .progress > i')[1] as HTMLElement
    expect(schoolFill.style.width).toBe('100%')
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
