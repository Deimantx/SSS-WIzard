import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameTooltip, TooltipProvider, useTooltipDetailMode } from './Tooltip'

function TooltipFixture() {
  return <TooltipProvider><GameTooltip content="Alpha details"><button>A</button></GameTooltip><GameTooltip content="Beta details"><button>B</button></GameTooltip></TooltipProvider>
}

function WideTooltipFixture() {
  return <TooltipProvider><GameTooltip wide delay={0} content={<div>Wide details {Array.from({ length: 40 }, (_, index) => <span key={index}> row</span>)}</div>}><button>Wide</button></GameTooltip></TooltipProvider>
}

function DetailModeProbe() {
  const { advanced } = useTooltipDetailMode()
  return <output data-testid="tooltip-detail-mode">{advanced ? 'advanced' : 'compact'}</output>
}

function DetailModeTooltipFixture() {
  return <TooltipProvider><GameTooltip delay={0} content={<DetailModeProbe />}><button>Details</button></GameTooltip></TooltipProvider>
}

function DetailModePairFixture({ delay = 0, wide = false }: { delay?: number; wide?: boolean }) {
  return <TooltipProvider><GameTooltip delay={delay} wide={wide} content={<DetailModeProbe />}><button>A</button></GameTooltip><GameTooltip delay={delay} wide={wide} content={<DetailModeProbe />}><button>B</button></GameTooltip></TooltipProvider>
}

function ResizeProbe() {
  const { advanced } = useTooltipDetailMode()
  return <div style={{ height: advanced ? 500 : 80 }}>{advanced ? 'Advanced size' : 'Compact size'}</div>
}

function ResizingWideTooltipFixture() {
  return <TooltipProvider><GameTooltip wide delay={0} content={<ResizeProbe />}><button>Resize</button></GameTooltip></TooltipProvider>
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
    act(() => { vi.advanceTimersByTime(70) })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('tracks Alt centrally, resets it on keyup and blur, and supports Alt before opening', () => {
    vi.useFakeTimers()
    render(<DetailModeTooltipFixture />)
    expect(screen.queryByTestId('tooltip-detail-mode')).toBeNull()

    fireEvent.keyDown(window, { key: 'Alt' })
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Details' }))
    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.getByTestId('tooltip-detail-mode').textContent).toBe('advanced')

    fireEvent.keyUp(window, { key: 'Alt' })
    expect(screen.getByTestId('tooltip-detail-mode').textContent).toBe('compact')
    fireEvent.keyDown(window, { key: 'Alt' })
    fireEvent.blur(window)
    expect(screen.getByTestId('tooltip-detail-mode').textContent).toBe('compact')
  })

  it('keeps Escape dismissal independent from Alt handling', () => {
    vi.useFakeTimers()
    render(<TooltipFixture />)
    const trigger = screen.getByRole('button', { name: 'A' })
    fireEvent.focus(trigger)
    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.getByRole('tooltip')).toBeTruthy()
    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('reopens the same tooltip with Alt details after a complete close', () => {
    vi.useFakeTimers()
    render(<DetailModePairFixture wide />)
    const trigger = screen.getByRole('button', { name: 'A' })

    fireEvent.pointerEnter(trigger)
    act(() => { vi.advanceTimersByTime(1) })
    fireEvent.keyDown(window, { key: 'Alt' })
    expect(screen.getByTestId('tooltip-detail-mode').textContent).toBe('advanced')
    fireEvent.keyUp(window, { key: 'Alt' })
    fireEvent.pointerLeave(trigger)
    act(() => { vi.advanceTimersByTime(70) })
    expect(screen.queryByRole('tooltip')).toBeNull()

    fireEvent.pointerEnter(trigger)
    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.getByTestId('tooltip-detail-mode').textContent).toBe('compact')
    fireEvent.keyDown(window, { key: 'Alt' })
    expect(screen.getByTestId('tooltip-detail-mode').textContent).toBe('advanced')
    fireEvent.keyUp(window, { key: 'Alt' })
  })

  it('applies Alt details independently to a different tooltip target', () => {
    vi.useFakeTimers()
    render(<DetailModePairFixture />)
    const first = screen.getByRole('button', { name: 'A' })
    const second = screen.getByRole('button', { name: 'B' })

    fireEvent.pointerEnter(first)
    act(() => { vi.advanceTimersByTime(1) })
    fireEvent.keyDown(window, { key: 'Alt' })
    expect(screen.getByTestId('tooltip-detail-mode').textContent).toBe('advanced')
    fireEvent.keyUp(window, { key: 'Alt' })
    fireEvent.pointerLeave(first)
    act(() => { vi.advanceTimersByTime(70) })

    fireEvent.pointerEnter(second)
    act(() => { vi.advanceTimersByTime(1) })
    fireEvent.keyDown(window, { key: 'Alt' })
    expect(screen.getByTestId('tooltip-detail-mode').textContent).toBe('advanced')
    fireEvent.keyUp(window, { key: 'Alt' })
  })

  it('captures bare Alt only while a tooltip is pending or active', () => {
    vi.useFakeTimers()
    render(<DetailModePairFixture delay={500} />)
    const trigger = screen.getByRole('button', { name: 'A' })

    const withoutTooltip = new KeyboardEvent('keydown', { key: 'Alt', cancelable: true })
    window.dispatchEvent(withoutTooltip)
    expect(withoutTooltip.defaultPrevented).toBe(false)
    fireEvent.keyUp(window, { key: 'Alt' })

    fireEvent.pointerEnter(trigger)
    const whilePending = new KeyboardEvent('keydown', { key: 'Alt', cancelable: true })
    window.dispatchEvent(whilePending)
    expect(whilePending.defaultPrevented).toBe(true)
    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.getByTestId('tooltip-detail-mode').textContent).toBe('advanced')

    fireEvent.keyUp(window, { key: 'Alt' })
    const whileActive = new KeyboardEvent('keydown', { key: 'Alt', cancelable: true })
    window.dispatchEvent(whileActive)
    expect(whileActive.defaultPrevented).toBe(true)
    fireEvent.keyUp(window, { key: 'Alt' })
  })

  it('recovers after blur and can use Alt again after closing', () => {
    vi.useFakeTimers()
    render(<DetailModePairFixture />)
    const trigger = screen.getByRole('button', { name: 'A' })

    fireEvent.pointerEnter(trigger)
    act(() => { vi.advanceTimersByTime(1) })
    fireEvent.keyDown(window, { key: 'Alt' })
    expect(screen.getByTestId('tooltip-detail-mode').textContent).toBe('advanced')
    fireEvent.blur(window)
    expect(screen.getByTestId('tooltip-detail-mode').textContent).toBe('compact')
    fireEvent.pointerLeave(trigger)
    act(() => { vi.advanceTimersByTime(70) })

    fireEvent.pointerEnter(trigger)
    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.getByTestId('tooltip-detail-mode').textContent).toBe('compact')
    fireEvent.keyDown(window, { key: 'Alt' })
    expect(screen.getByTestId('tooltip-detail-mode').textContent).toBe('advanced')
    fireEvent.keyUp(window, { key: 'Alt' })
  })

  it('keeps a same-ID active request open without restarting its delay', () => {
    vi.useFakeTimers()
    render(<DetailModePairFixture delay={500} />)
    const trigger = screen.getByRole('button', { name: 'A' })
    fireEvent.pointerEnter(trigger)
    act(() => { vi.advanceTimersByTime(500) })
    const tooltip = screen.getByRole('tooltip')

    fireEvent.pointerEnter(trigger)
    expect(screen.getByRole('tooltip')).toBe(tooltip)
    act(() => { vi.advanceTimersByTime(501) })
    expect(screen.getByRole('tooltip')).toBe(tooltip)
  })

  it('bridges pointer movement across a wide tooltip and its trigger', () => {
    vi.useFakeTimers()
    render(<DetailModePairFixture wide />)
    const trigger = screen.getByRole('button', { name: 'A' })
    fireEvent.pointerEnter(trigger)
    act(() => { vi.advanceTimersByTime(1) })
    const tooltip = screen.getByRole('tooltip')

    fireEvent.pointerLeave(trigger)
    fireEvent.pointerEnter(tooltip)
    fireEvent.pointerLeave(tooltip)
    fireEvent.pointerEnter(trigger)
    act(() => { vi.advanceTimersByTime(501) })
    expect(screen.getByRole('tooltip')).toBe(tooltip)
  })

  it('does not destroy the wide tooltip when Alt changes its content size', () => {
    vi.useFakeTimers()
    render(<ResizingWideTooltipFixture />)
    const trigger = screen.getByRole('button', { name: 'Resize' })
    fireEvent.pointerEnter(trigger)
    act(() => { vi.advanceTimersByTime(1) })
    const tooltip = screen.getByRole('tooltip')
    expect(screen.getByText('Compact size')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Alt' })
    expect(screen.getByRole('tooltip')).toBe(tooltip)
    expect(screen.getByText('Advanced size')).toBeTruthy()
    fireEvent.keyUp(window, { key: 'Alt' })
    expect(screen.getByRole('tooltip')).toBe(tooltip)
    expect(screen.getByText('Compact size')).toBeTruthy()
  })
})
