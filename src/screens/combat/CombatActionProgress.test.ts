import { describe, expect, it } from 'vitest'
import {
  COMBAT_TIMELINE_COMPLETION_CAP,
  getCombatTimelineProgress,
  getCombatVisualRate,
  getCombatVisualTimelineProgress,
  reconcileCombatTimelineSnapshot,
  sampleCombatVisualTimeline,
} from './performance/combatTimeline'

const snapshot = (remainingWorkMs: number, extra: Partial<{ cycleId: string; rate: number; blocked: boolean; snapshotAtMs: number }> = {}) => ({
  cycleId: extra.cycleId ?? 'cycle-1',
  baseWorkMs: 1_000,
  remainingWorkMs,
  rate: extra.rate ?? 1,
  blocked: extra.blocked ?? false,
  ...(extra.snapshotAtMs === undefined ? {} : { snapshotAtMs: extra.snapshotAtMs }),
})

describe('combat visual timeline reconciliation', () => {
  it('confirms a normal tick without replacing the original anchor', () => {
    const initial = reconcileCombatTimelineSnapshot(null, snapshot(1_000), 0).state
    const result = reconcileCombatTimelineSnapshot(initial, snapshot(900, { snapshotAtMs: 100 }), 112)

    expect(result.kind).toBe('normal-confirmation')
    expect(result.hardReset).toBe(false)
    expect(result.requiresImmediatePaint).toBe(false)
    expect(result.state.anchoredAtMs).toBe(0)
    expect(sampleCombatVisualTimeline(result.state, 212)).toBeCloseTo(788)
  })

  it('soft-corrects forward drift without a backward visual correction', () => {
    const initial = reconcileCombatTimelineSnapshot(null, snapshot(1_000), 0).state
    const result = reconcileCombatTimelineSnapshot(initial, snapshot(850), 100)

    expect(result.kind).toBe('soft-correction')
    expect(result.softCorrection).toBe(true)
    expect(result.backwardCorrection).toBe(false)
    expect(sampleCombatVisualTimeline(result.state, 100)).toBeCloseTo(900)
    expect(sampleCombatVisualTimeline(result.state, 200)).toBeCloseTo(750)
  })

  it('hard-rebases a real timer extension', () => {
    const initial = reconcileCombatTimelineSnapshot(null, snapshot(1_000), 0).state
    const result = reconcileCombatTimelineSnapshot(initial, snapshot(1_100), 500)

    expect(result.kind).toBe('timer-rebase')
    expect(result.hardReset).toBe(true)
    expect(result.backwardCorrection).toBe(true)
    expect(sampleCombatVisualTimeline(result.state, 500)).toBeCloseTo(1_100)
  })

  it('preserves position across rate and pause changes', () => {
    const initial = reconcileCombatTimelineSnapshot(null, snapshot(1_000), 0).state
    const slowed = reconcileCombatTimelineSnapshot(initial, snapshot(600, { rate: 1.15 }), 400)
    expect(slowed.kind).toBe('rate-change')
    expect(sampleCombatVisualTimeline(slowed.state, 400)).toBeCloseTo(600)
    expect(sampleCombatVisualTimeline(slowed.state, 500)).toBeCloseTo(485)

    const paused = reconcileCombatTimelineSnapshot(slowed.state, snapshot(500, { rate: 0, blocked: true }), 500)
    expect(paused.kind).toBe('pause-change')
    expect(sampleCombatVisualTimeline(paused.state, 1_000)).toBeCloseTo(485)

    const resumed = reconcileCombatTimelineSnapshot(paused.state, snapshot(500, { rate: 1 }), 1_000)
    expect(resumed.kind).toBe('pause-change')
    expect(sampleCombatVisualTimeline(resumed.state, 1_100)).toBeCloseTo(385)
  })

  it('keeps slightly noisy normal snapshots monotonic and caps unconfirmed completion', () => {
    const unconfirmed = reconcileCombatTimelineSnapshot(null, snapshot(1_000), 0).state
    expect(getCombatVisualTimelineProgress(unconfirmed, 1_000)).toBeCloseTo(COMBAT_TIMELINE_COMPLETION_CAP)

    let state = reconcileCombatTimelineSnapshot(null, snapshot(1_000), 0).state
    let previousProgress = 0
    ;[903, 798, 704, 599, 501, 0].forEach((remainingWorkMs, index) => {
      const now = (index + 1) * 100
      state = reconcileCombatTimelineSnapshot(state, snapshot(remainingWorkMs, { snapshotAtMs: now }), now).state
      const progress = getCombatVisualTimelineProgress(state, now)
      expect(progress).toBeGreaterThanOrEqual(previousProgress)
      previousProgress = progress
    })
    expect(getCombatVisualTimelineProgress(state, 0)).toBe(1)
    expect(COMBAT_TIMELINE_COMPLETION_CAP).toBeGreaterThan(0.99)
  })
})

describe('combat visual timeline compatibility math', () => {
  it('keeps the legacy pure interpolation helpers safe', () => {
    const current = snapshot(600)
    const anchor = { snapshot: current, anchoredAtMs: 100 }
    expect(getCombatTimelineProgress(current, 300, anchor)).toBeCloseTo(0.6)
    expect(getCombatVisualRate(1, false, 2)).toBe(2)
    expect(getCombatVisualRate(1, true, 2)).toBe(0)
  })
})
