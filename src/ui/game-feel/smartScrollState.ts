export interface ScrollMetrics {
  scrollTop: number
  clientHeight: number
  scrollHeight: number
  epsilon?: number
}

export interface ScrollAffordanceState {
  canScrollUp: boolean
  canScrollDown: boolean
  isOverflowing: boolean
}

/** Tolerant scroll-direction state shared by every bounded game scroll owner. */
export function getScrollAffordance({ scrollTop, clientHeight, scrollHeight, epsilon = 2 }: ScrollMetrics): ScrollAffordanceState {
  const isOverflowing = scrollHeight > clientHeight + epsilon
  return {
    isOverflowing,
    canScrollUp: isOverflowing && scrollTop > epsilon,
    canScrollDown: isOverflowing && scrollTop + clientHeight < scrollHeight - epsilon,
  }
}
