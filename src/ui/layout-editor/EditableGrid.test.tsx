import { act, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import type { Layout } from 'react-grid-layout'

const gridState = vi.hoisted(() => ({ layout: [] as Layout[] }))

vi.mock('react-grid-layout', async () => {
  const actual = await vi.importActual<typeof import('react-grid-layout')>('react-grid-layout')
  return {
    ...actual,
    useContainerWidth: () => ({ width: 1100, mounted: true, containerRef: { current: null }, measureWidth: vi.fn() }),
    GridLayout: ({ layout, children }: { layout: Layout; children: ReactNode }) => {
      gridState.layout.push(layout)
      return <div data-testid="mock-grid">{children}</div>
    },
  }
})

import { EditableGrid } from './EditableGrid'
import { resetAllScreenLayouts, closeLayoutEditor } from './layoutEditorStore'

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = []
  target: Element | null = null
  constructor(private readonly callback: ResizeObserverCallback) { ResizeObserverMock.instances.push(this) }
  observe(target: Element) { this.target = target }
  disconnect() { this.target = null }
  trigger() { this.callback([{ target: this.target, contentRect: {} as DOMRectReadOnly } as ResizeObserverEntry], this as unknown as ResizeObserver) }
}

describe('EditableGrid runtime geometry', () => {
  beforeEach(() => {
    localStorage.clear()
    resetAllScreenLayouts()
    closeLayoutEditor()
    gridState.layout = []
    ResizeObserverMock.instances = []
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  it('reflows a lower panel after natural content measurement', async () => {
    render(<EditableGrid screen="tower-transmutation" panels={[
      { id: 'transmutation-detail', content: <div>Detail content</div> },
      { id: 'transmutation-output-preview', content: <div>Output content</div> },
    ]} />)
    const detailObserver = ResizeObserverMock.instances.find((observer) => observer.target?.className.toString().includes('height-mode-content'))
    expect(detailObserver?.target).toBeTruthy()
    Object.defineProperty(detailObserver?.target, 'getBoundingClientRect', { configurable: true, value: () => ({ height: 360 }) })
    act(() => detailObserver?.trigger())
    await waitFor(() => {
      const latest = gridState.layout.at(-1) ?? []
      expect(latest.find((item) => item.i === 'transmutation-output-preview')?.y).toBe(9)
    })
  })
})
