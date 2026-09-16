import { describe, expect, it } from 'vitest'
import { formatResourceAmount, formatResourceRate, hasEnoughResource, stabilizeResourceValue } from './resourcePresentation'

describe('resource presentation policy', () => {
  it('stabilizes floating-point residue and formats Mana amounts as whole numbers', () => {
    expect(stabilizeResourceValue(29.50000000000004)).toBe(29.5)
    expect(stabilizeResourceValue(0.00000000001)).toBe(0)
    expect(formatResourceAmount(29.50000000000004)).toBe('30')
    expect(formatResourceAmount(30)).toBe('30')
    expect(formatResourceAmount(12.98699999988075)).toBe('13')
    expect(formatResourceAmount(32.01300000011925)).toBe('32')
    expect(formatResourceAmount(15.013000000119252)).toBe('15')
    expect(formatResourceRate(29.5)).toBe('29.5')
  })

  it('uses the same epsilon-aware affordability boundary', () => {
    expect(hasEnoughResource(10, 10.0000000001)).toBe(true)
    expect(hasEnoughResource(9.99, 10)).toBe(false)
  })
})
