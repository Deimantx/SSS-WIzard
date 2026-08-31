import { describe, expect, it } from 'vitest'
import { formatCooldownNumber, getCooldownFraction } from './combatCooldownPresentation'

describe('combat cooldown presentation', () => {
  it('clamps canonical remaining time to a proportional fraction', () => {
    expect(getCooldownFraction(3500, 3500)).toBe(1)
    expect(getCooldownFraction(1750, 3500)).toBe(0.5)
    expect(getCooldownFraction(350, 3500)).toBe(0.1)
    expect(getCooldownFraction(0, 3500)).toBe(0)
    expect(getCooldownFraction(8000, 3500)).toBe(1)
  })

  it('formats short cooldowns like action-bar countdowns', () => {
    expect(formatCooldownNumber(3400)).toBe('3.4')
    expect(formatCooldownNumber(800)).toBe('0.8')
    expect(formatCooldownNumber(12_000)).toBe('12')
    expect(formatCooldownNumber(0)).toBe('')
  })
})
