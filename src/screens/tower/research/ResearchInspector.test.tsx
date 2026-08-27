import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { prepareResearchAction } from '../../../store/actions/researchActions'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { ResearchInspector } from './ResearchInspector'

const researchState = (quantity = 100) => {
  const state = createInitialState()
  state.inventory['fire-fragment'] = quantity
  useGameStore.getState().hydrateState(state)
}

const valueMetric = (label: string) => {
  const metric = Array.from(document.querySelectorAll('.research-metric')).find((node) => node.querySelector('small')?.textContent === label)
  return metric?.querySelector('strong')?.textContent
}

describe('ResearchInspector', () => {
  beforeEach(() => { useGameStore.getState().resetSave(); resetAllUiPreferences() })

  it('updates XP previews when the target school changes', () => {
    researchState()
    render(<ResearchInspector itemId="fire-fragment" />)

    expect(screen.getAllByRole('button', { name: /^(FIRE|WATER|EARTH|AIR)$/ })).toHaveLength(4)
    expect((screen.getByRole('button', { name: 'FIRE' }) as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true')
    expect(valueMetric('XP / ITEM')).toBe('12')
    fireEvent.click(screen.getByRole('button', { name: 'WATER' }))
    expect(valueMetric('XP / ITEM')).toBe('8')
    expect((screen.getByRole('button', { name: 'WATER' }) as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'WATER' }).textContent).toContain('LV 1 / 10')
  })

  it('updates the projected target-school result with quantity and target changes', () => {
    researchState()
    render(<ResearchInspector itemId="fire-fragment" />)

    expect(screen.getByText('PROJECTED SCHOOL')).toBeTruthy()
    expect(document.querySelector('.research-projection-school')?.textContent).toBe('Fire')
    const slider = screen.getByLabelText('Research quantity slider') as HTMLInputElement
    fireEvent.change(slider, { target: { value: '2' } })
    expect(document.querySelector('.research-projection-level strong')?.textContent).toContain('LV 2')
    fireEvent.click(screen.getByRole('button', { name: 'WATER' }))
    expect(document.querySelector('.research-projection-school')?.textContent).toBe('Water')
  })

  it('uses unreserved quantity for the slider and preserves inventory on Prepare', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 100
    prepareResearchAction(state, 'fire-fragment', 'fire', 25)
    useGameStore.getState().hydrateState(state)
    render(<ResearchInspector itemId="fire-fragment" />)

    const slider = screen.getByLabelText('Research quantity slider') as HTMLInputElement
    expect(slider.max).toBe('75')
    fireEvent.change(slider, { target: { value: '75' } })
    expect(screen.getByText('75 / 75')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'PREPARE' }))

    const saved = useGameStore.getState()
    expect(saved.inventory['fire-fragment']).toBe(100)
    expect(saved.activities.research.slots['research-1']).toMatchObject({ requestedQuantity: 100, remainingQuantity: 100, echoesAssigned: 0 })
  })

  it('allows preparing a target at cap while keeping Echo assignment blocked by status', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 10
    state.schools.fire.level = state.progress.magicLevelCap
    state.schools.fire.xp = state.progress.magicLevelCap * 20
    useGameStore.getState().hydrateState(state)
    render(<ResearchInspector itemId="fire-fragment" />)

    expect(screen.getByText('LEVEL CAP')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'PREPARE' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('disables Prepare when all unique slots are occupied and the target cannot merge', () => {
    const state = createInitialState()
    ;(['fire', 'water', 'earth', 'air'] as const).forEach((school) => {
      state.inventory[`${school}-fragment`] = 10
      prepareResearchAction(state, `${school}-fragment` as never, school, 5)
    })
    useGameStore.getState().hydrateState(state)
    render(<ResearchInspector itemId="fire-fragment" />)
    fireEvent.click(screen.getByRole('button', { name: 'WATER' }))

    expect((screen.getByRole('button', { name: 'PREPARE' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
