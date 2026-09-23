import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { MagicSchoolsHeader } from './MagicSchoolsHeader'

describe('MagicSchoolsHeader tooltips', () => {
  afterEach(() => { vi.useRealTimers() })

  it('shows the authored compact tooltip for every school tab', () => {
    vi.useFakeTimers()
    const state = createInitialState()
    render(<TooltipProvider><MagicSchoolsHeader schools={state.schools} selectedSchool="fire" onSelect={vi.fn()} /></TooltipProvider>)

    for (const school of ['Fire', 'Water', 'Earth', 'Air']) {
      const tab = screen.getByRole('tab', { name: new RegExp(`${school.toUpperCase()}LV\\. 1`) })
      fireEvent.pointerEnter(tab)
      act(() => { vi.advanceTimersByTime(250) })
      expect(screen.getByRole('tooltip').textContent).toContain(`${school} School`)
      fireEvent.pointerLeave(tab)
      act(() => { vi.advanceTimersByTime(70) })
    }
  })
})
