import { describe, expect, it } from 'vitest'
import { shouldResetCombatActionProgress } from './CombatActionProgress'

describe('combat action progress reset mode', () => {
  it('snaps a known cycle wrap', () => expect(shouldResetCombatActionProgress(95, 5, true)).toBe(true))
  it('animates normal forward progress', () => expect(shouldResetCombatActionProgress(40, 45, false)).toBe(false))
  it('snaps any meaningful backward movement even when the cycle id repeats', () => expect(shouldResetCombatActionProgress(70, 20, false)).toBe(true))
  it('snaps delayed backward movement after a repeated step', () => expect(shouldResetCombatActionProgress(55, 35, true)).toBe(true))
  it('does not reset a tiny rounding change', () => expect(shouldResetCombatActionProgress(40, 39.995, true)).toBe(false))
})
