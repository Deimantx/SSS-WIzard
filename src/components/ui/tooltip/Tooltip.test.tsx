import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameTooltip, TooltipProvider } from './Tooltip'

function TooltipFixture() {
  return <TooltipProvider><GameTooltip content="Alpha details"><button>A</button></GameTooltip><GameTooltip content="Beta details"><button>B</button></GameTooltip></TooltipProvider>
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
})
