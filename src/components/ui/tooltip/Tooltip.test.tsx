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

function LayoutNeutralFixture() {
  return <TooltipProvider><div data-testid="grid" style={{ display: 'grid' }}><GameTooltip content="Grid details"><button data-testid="grid-target">Grid target</button></GameTooltip><button>Other</button></div><div data-testid="flex" style={{ display: 'flex' }}><GameTooltip content="Flex details"><button data-testid="flex-target">Flex target</button></GameTooltip><button>Other</button></div></TooltipProvider>
}

function AbsoluteTargetFixture() {
  return <TooltipProvider><div data-testid="absolute-parent" style={{ position: 'relative', width: 800, height: 600 }}><GameTooltip delay={0} content="Absolute details"><button data-testid="absolute-target" style={{ position: 'absolute', left: 500, top: 300 }}>Absolute target</button></GameTooltip></div></TooltipProvider>
}

function UnmountingFixture() {
  return <TooltipProvider><GameTooltip delay={0} content="Unmount details"><button>Unmount target</button></GameTooltip></TooltipProvider>
}

function DisabledTargetFixture() {
  return <TooltipProvider><GameTooltip delay={0} content="Disabled details"><button disabled>Disabled target</button></GameTooltip></TooltipProvider>
}

describe('TooltipProvider singleton timing', () => {
  afterEach(() => { vi.useRealTimers() })

  it('cancels stale pending requests and waits 250ms for the new target', () => {
    vi.useFakeTimers()
    render(<TooltipFixture />)
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'A' }))
    act(() => { vi.advanceTimersByTime(300) })
    fireEvent.pointerLeave(screen.getByRole('button', { name: 'A' }))
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'B' }))
    act(() => { vi.advanceTimersByTime(149) })
    expect(screen.queryByRole('tooltip')).toBeNull()
    act(() => { vi.advanceTimersByTime(101) })
    expect(screen.getByRole('tooltip').textContent).toContain('Beta details')
    expect(document.querySelectorAll('[role="tooltip"]')).toHaveLength(1)
  })

  it('marks a portaled tooltip ready after position measurement', () => {
    vi.useFakeTimers()
    render(<TooltipFixture />)
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'A' }))
    act(() => { vi.advanceTimersByTime(250) })

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.classList.contains('is-positioned')).toBe(true)
  })

  it('keeps grid and flex children direct while adding tooltip behavior', () => {
    render(<LayoutNeutralFixture />)
    const grid = screen.getByTestId('grid')
    const flex = screen.getByTestId('flex')
    expect(grid.children).toHaveLength(2)
    expect(flex.children).toHaveLength(2)
    expect(screen.getByTestId('grid-target').parentElement).toBe(grid)
    expect(screen.getByTestId('flex-target').parentElement).toBe(flex)
    expect(screen.getByTestId('grid-target').classList.contains('game-tooltip-trigger')).toBe(true)
  })

  it('positions from the actual absolute child element', () => {
    vi.useFakeTimers()
    render(<AbsoluteTargetFixture />)
    const target = screen.getByTestId('absolute-target')
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ top: 300, left: 500, right: 580, bottom: 340, width: 80, height: 40, x: 500, y: 300, toJSON: () => ({}) })
    fireEvent.pointerEnter(target)
    act(() => { vi.advanceTimersByTime(1) })
    const tooltip = screen.getByRole('tooltip')
    expect(Number.parseFloat(tooltip.style.left)).toBeGreaterThan(500 - 1)
    expect(Number.parseFloat(tooltip.style.top)).toBeGreaterThan(240)
  })

  it('repositions an active tooltip when its target moves', () => {
    vi.useFakeTimers()
    render(<AbsoluteTargetFixture />)
    const target = screen.getByTestId('absolute-target')
    let top = 300
    vi.spyOn(target, 'getBoundingClientRect').mockImplementation(() => ({ top, left: 500, right: 580, bottom: top + 40, width: 80, height: 40, x: 500, y: top, toJSON: () => ({}) }))
    fireEvent.pointerEnter(target)
    act(() => { vi.advanceTimersByTime(1) })
    const tooltip = screen.getByRole('tooltip')
    const firstTop = tooltip.style.top
    top = 420
    fireEvent.scroll(window)
    expect(tooltip.style.top).not.toBe(firstTop)
  })

  it('dismisses on pointer down and when the target unmounts', () => {
    vi.useFakeTimers()
    const view = render(<UnmountingFixture />)
    const target = screen.getByRole('button', { name: 'Unmount target' })
    fireEvent.pointerEnter(target)
    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.getByRole('tooltip')).toBeTruthy()
    fireEvent.pointerDown(target, { pointerType: 'mouse' })
    expect(screen.queryByRole('tooltip')).toBeNull()

    fireEvent.pointerEnter(target)
    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.getByRole('tooltip')).toBeTruthy()
    view.unmount()
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
  })

  it('uses an opt-in-sized fallback anchor only for disabled native targets', () => {
    vi.useFakeTimers()
    render(<DisabledTargetFixture />)
    const target = screen.getByRole('button', { name: 'Disabled target' })
    expect(target.parentElement?.classList.contains('game-tooltip-disabled-anchor')).toBe(true)
    fireEvent.pointerEnter(target.parentElement as HTMLElement)
    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.getByRole('tooltip').textContent).toContain('Disabled details')
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
