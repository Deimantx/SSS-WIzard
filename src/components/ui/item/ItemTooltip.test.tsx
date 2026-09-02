import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../tooltip/Tooltip'
import { ItemTooltip } from './ItemTooltip'

describe('equipment Item Tooltip presentation', () => {
  afterEach(() => vi.useRealTimers())

  it('shows universal combat mechanics from item.combat', () => {
    vi.useFakeTimers()
    render(<TooltipProvider><ItemTooltip itemId="ember-staff" owned={1}><button>Ember Staff</button></ItemTooltip></TooltipProvider>)
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Ember Staff' }))
    act(() => { vi.advanceTimersByTime(500) })
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.textContent).toContain('COMBAT EFFECTS')
    expect(tooltip.textContent).toContain('+20% Fire Spell Damage')
  })
})
