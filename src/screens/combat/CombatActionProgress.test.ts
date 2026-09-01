import { describe, expect, it } from 'vitest'
import { shouldResetCombatActionProgress } from './CombatActionProgress'

describe('combat action progress reset mode', () => {
  it('snaps a known cycle wrap', () => expect(shouldResetCombatActionProgress(95, 5, true)).toBe(true))
  it('animates normal forward progress', () => expect(shouldResetCombatActionProgress(40, 45, false)).toBe(false))
  it('does not reset a tiny rounding change', () => expect(shouldResetCombatActionProgress(40, 39.995, true)).toBe(false))
})
