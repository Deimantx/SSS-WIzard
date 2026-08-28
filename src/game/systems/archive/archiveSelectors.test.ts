import { describe, expect, it } from 'vitest'
import { completionPercent } from './archiveSelectors'

describe('archive completion math', () => {
  it.each([
    [6, 8, 75],
    [1, 3, 33],
    [0, 1, 0],
    [0, 0, 0],
    [10, 5, 100],
    [-1, 5, 0],
  ])('calculates %s / %s as %s%%', (discovered, total, expected) => {
    expect(completionPercent(discovered, total)).toBe(expected)
  })
})
