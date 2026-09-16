import { describe, expect, it } from 'vitest'
import { formatResourceAmount, hasEnoughResource, stabilizeResourceValue } from './resourcePresentation'

describe('resource presentation policy', () => {
  it('stabilizes floating-point residue without reducing useful precision', () => {
    expect(stabilizeResourceValue(29.50000000000004)).toBe(29.5)
    expect(stabilizeResourceValue(0.00000000001)).toBe(0)
    expect(formatResourceAmount(29.50000000000004)).toBe('29.5')
    expect(formatResourceAmount(12.98699999988075)).toBe('12.99')
  })

  it('uses the same epsilon-aware affordability boundary', () => {
    expect(hasEnoughResource(10, 10.0000000001)).toBe(true)
    expect(hasEnoughResource(9.99, 10)).toBe(false)
  })
})
