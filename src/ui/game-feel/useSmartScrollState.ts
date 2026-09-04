import { useEffect, type RefObject } from 'react'
import { getScrollAffordance } from './smartScrollState'

interface SmartScrollOptions {
  /** Reset only the attached scroll owner when its inspected identity changes. */
  resetKey?: string | number | null
  /** Values that can change the size or contents of the scroll owner. */
  dependencies?: readonly unknown[]
  epsilon?: number
}

function updateScrollAttributes(element: HTMLElement, epsilon: number) {
  const state = getScrollAffordance({
    scrollTop: element.scrollTop,
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    epsilon,
  })
  element.dataset.scrollOverflow = String(state.isOverflowing)
  element.dataset.scrollUp = String(state.canScrollUp)
  element.dataset.scrollDown = String(state.canScrollDown)
}

function scheduleUpdate(element: HTMLElement, epsilon: number) {
  if (typeof requestAnimationFrame === 'function') {
    return requestAnimationFrame(() => updateScrollAttributes(element, epsilon))
  }
  updateScrollAttributes(element, epsilon)
  return null
}

/**
 * Tracks a real scroll element without putting scroll position in React state.
 * CSS reads the data attributes and paints the directional affordance.
 */
export function useSmartScrollState(ref: RefObject<HTMLElement | null>, { resetKey, dependencies = [], epsilon = 2 }: SmartScrollOptions = {}) {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    let frame: number | null = null
    const update = () => {
      if (frame !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
      frame = scheduleUpdate(element, epsilon)
    }

    updateScrollAttributes(element, epsilon)
    element.addEventListener('scroll', update, { passive: true })
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(element)
    for (const child of Array.from(element.children)) observer?.observe(child)
    return () => {
      if (frame !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
      element.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  // The dependency values intentionally trigger a post-commit measurement when dynamic content changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, epsilon, ...dependencies])

  useEffect(() => {
    if (resetKey === undefined) return
    const element = ref.current
    if (!element) return
    element.scrollTop = 0
    updateScrollAttributes(element, epsilon)
  }, [ref, resetKey, epsilon])
}
