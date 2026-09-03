import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePanelNaturalHeight } from './usePanelNaturalHeight'

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = []
  private readonly callback: ResizeObserverCallback
  private target: Element | null = null

  constructor(callback: ResizeObserverCallback) { this.callback = callback; ResizeObserverMock.instances.push(this) }
  observe(target: Element) { this.target = target }
  disconnect() { this.target = null }
  trigger() { this.callback([{ target: this.target, contentRect: {} as DOMRectReadOnly } as ResizeObserverEntry], this as unknown as ResizeObserver) }
}

describe('usePanelNaturalHeight', () => {
  afterEach(() => { ResizeObserverMock.instances = []; vi.unstubAllGlobals() })

  it('reports initial natural height and ResizeObserver changes without polling', () => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1 })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const target = document.createElement('div')
    let height = 120
    vi.spyOn(target, 'getBoundingClientRect').mockImplementation(() => ({ height } as DOMRect))
    const ref = { current: target }
    const onHeightChange = vi.fn()
    renderHook(() => usePanelNaturalHeight(ref, true, onHeightChange))
    expect(onHeightChange).toHaveBeenLastCalledWith(120)
    height = 240
    act(() => ResizeObserverMock.instances[0].trigger())
    expect(onHeightChange).toHaveBeenLastCalledWith(240)
  })
})
