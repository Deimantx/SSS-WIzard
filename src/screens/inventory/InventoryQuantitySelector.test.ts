import { describe, expect, it } from 'vitest'
import { clampInventoryQuantity } from './InventoryQuantitySelector'

describe('inventory quantity controls', () => {
  it('clamps direct and external quantity changes to the actionable range', () => {
    expect(clampInventoryQuantity(15, 12)).toBe(12)
    expect(clampInventoryQuantity(0, 17)).toBe(1)
    expect(clampInventoryQuantity(Number.NaN, 17)).toBe(1)
    expect(clampInventoryQuantity(15, 0)).toBe(0)
  })
})
