import { describe, expect, it } from 'vitest'
import { shouldResetCombatActionProgress } from './CombatActionProgress'
import { getCombatTimelineProgress, getCombatTimelineRemainingWork, getCombatVisualRate } from './performance/combatTimeline'

describe('combat action progress reset mode', () => {
  it('snaps a known cycle wrap', () => expect(shouldResetCombatActionProgress(95, 5, true)).toBe(true))
  it('animates normal forward progress', () => expect(shouldResetCombatActionProgress(40, 45, false)).toBe(false))
  it('snaps any meaningful backward movement even when the cycle id repeats', () => expect(shouldResetCombatActionProgress(70, 20, false)).toBe(true))
  it('snaps delayed backward movement after a repeated step', () => expect(shouldResetCombatActionProgress(55, 35, true)).toBe(true))
  it('does not reset a tiny rounding change', () => expect(shouldResetCombatActionProgress(40, 39.995, true)).toBe(false))
})

describe('combat visual timeline math', () => {
  const snapshot = { cycleId: 'enemy:1:step-1', baseWorkMs: 1_000, remainingWorkMs: 600, rate: 1 }
  const anchor = { snapshot, anchoredAtMs: 100 }

  it('interpolates normal progress between snapshots', () => {
    expect(getCombatTimelineProgress(snapshot, 300, anchor)).toBeCloseTo(0.6)
    expect(getCombatTimelineRemainingWork(snapshot, 300, anchor)).toBeCloseTo(400)
  })
  it('pauses blocked and zero-rate timelines', () => {
    expect(getCombatTimelineProgress({ ...snapshot, blocked: true }, 900, { snapshot: { ...snapshot, blocked: true }, anchoredAtMs: 100 })).toBeCloseTo(0.4)
    expect(getCombatTimelineProgress({ ...snapshot, rate: 0 }, 900, { snapshot: { ...snapshot, rate: 0 }, anchoredAtMs: 100 })).toBeCloseTo(0.4)
  })
  it('clamps completion, invalid values and rate changes safely', () => {
    expect(getCombatTimelineProgress({ ...snapshot, remainingWorkMs: -50 }, 100, { snapshot: { ...snapshot, remainingWorkMs: -50 }, anchoredAtMs: 100 })).toBe(1)
    expect(getCombatTimelineProgress({ ...snapshot, remainingWorkMs: Number.NaN, baseWorkMs: Number.NaN, rate: Number.NaN }, 100, { snapshot: { ...snapshot, remainingWorkMs: Number.NaN, baseWorkMs: Number.NaN, rate: Number.NaN }, anchoredAtMs: 100 })).toBe(0)
    expect(getCombatVisualRate(1, false, 2)).toBe(2)
    expect(getCombatVisualRate(1, true, 2)).toBe(0)
  })
  it('allows an authoritative timer extension to move backward', () => {
    const extended = { ...snapshot, remainingWorkMs: 900 }
    expect(getCombatTimelineProgress(extended, 100, { snapshot: extended, anchoredAtMs: 100 })).toBeCloseTo(0.1)
  })
})
