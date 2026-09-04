import { describe, expect, it } from 'vitest'
import { getScrollAffordance } from './smartScrollState'

describe('getScrollAffordance', () => {
  it('reports no affordance when the content fits', () => {
    expect(getScrollAffordance({ scrollTop: 0, clientHeight: 100, scrollHeight: 100 })).toEqual({ canScrollUp: false, canScrollDown: false, isOverflowing: false })
  })

  it('reports only the lower affordance at the top', () => {
    expect(getScrollAffordance({ scrollTop: 0, clientHeight: 100, scrollHeight: 300 })).toEqual({ canScrollUp: false, canScrollDown: true, isOverflowing: true })
  })

  it('reports both affordances in the middle', () => {
    expect(getScrollAffordance({ scrollTop: 100, clientHeight: 100, scrollHeight: 300 })).toEqual({ canScrollUp: true, canScrollDown: true, isOverflowing: true })
  })

  it('reports only the upper affordance at the bottom', () => {
    expect(getScrollAffordance({ scrollTop: 200, clientHeight: 100, scrollHeight: 300 })).toEqual({ canScrollUp: true, canScrollDown: false, isOverflowing: true })
  })

  it('uses the epsilon at both edges', () => {
    expect(getScrollAffordance({ scrollTop: 2, clientHeight: 100, scrollHeight: 300 })).toMatchObject({ canScrollUp: false, canScrollDown: true })
    expect(getScrollAffordance({ scrollTop: 198, clientHeight: 100, scrollHeight: 300 })).toMatchObject({ canScrollUp: true, canScrollDown: false })
  })
})
