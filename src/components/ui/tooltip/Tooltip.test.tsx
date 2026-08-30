import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameTooltip, TooltipProvider } from './Tooltip'

function TooltipFixture() {
  return <TooltipProvider><GameTooltip content="Alpha details"><button>A</button></GameTooltip><GameTooltip content="Beta details"><button>B</button></GameTooltip></TooltipProvider>
}

function WideTooltipFixture() {
  return <TooltipProvider><GameTooltip wide delay={0} content={<div>Wide details {Array.from({ length: 40 }, (_, index) => <span key={index}> row</span>)}</div>}><button>Wide</button></GameTooltip></TooltipProvider>
}

describe('TooltipProvider singleton timing', () => {
  afterEach(() => { vi.useRealTimers() })

  it('cancels stale pending requests and waits 500ms for the new target', () => {
    vi.useFakeTimers()
    render(<TooltipFixture />)
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'A' }))
    act(() => { vi.advanceTimersByTime(300) })
    fireEvent.pointerLeave(screen.getByRole('button', { name: 'A' }))
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'B' }))
    act(() => { vi.advanceTimersByTime(199) })
    expect(screen.queryByRole('tooltip')).toBeNull()
    act(() => { vi.advanceTimersByTime(301) })
    expect(screen.getByRole('tooltip').textContent).toContain('Beta details')
    expect(document.querySelectorAll('[role="tooltip"]')).toHaveLength(1)
  })

  it('switches the visible tooltip without overlap', () => {
    vi.useFakeTimers()
    render(<TooltipFixture />)
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'A' }))
    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.getByRole('tooltip').textContent).toContain('Alpha details')
    fireEvent.pointerLeave(screen.getByRole('button', { name: 'A' }))
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'B' }))
    expect(screen.queryByText('Alpha details')).toBeNull()
    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.getByRole('tooltip').textContent).toContain('Beta details')
    expect(document.querySelectorAll('[role="tooltip"]')).toHaveLength(1)
  })

  it('bridges the trigger to an interactive wide tooltip surface', () => {
    vi.useFakeTimers()
    render(<WideTooltipFixture />)
    const trigger = screen.getByRole('button', { name: 'Wide' })
    fireEvent.pointerEnter(trigger)
    act(() => { vi.advanceTimersByTime(1) })
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.classList.contains('game-tooltip-wide')).toBe(true)

    fireEvent.pointerLeave(trigger)
    fireEvent.pointerEnter(tooltip)
    act(() => { vi.advanceTimersByTime(100) })
    expect(screen.getByRole('tooltip')).toBe(tooltip)
    fireEvent.wheel(tooltip)
    fireEvent.pointerLeave(tooltip)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
