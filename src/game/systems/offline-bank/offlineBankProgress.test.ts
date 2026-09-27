import { describe, expect, it } from 'vitest'
import { createOfflineProgressReporter } from './offlineBankFastForward'

describe('Offline Bank progress reporter', () => {
  it('is monotonic and preserves real simulated values with an injected clock', async () => {
    let now = 0
    const progress: Array<{ simulatedMs: number; totalMs: number; realElapsedMs: number }> = []
    const report = createOfflineProgressReporter(1_000, {
      onProgress: (value) => { progress.push(value) },
      environment: { now: () => now, yieldCpu: async () => {}, yieldPaint: async () => {} },
    })

    await report(0)
    now = 10
    await report(250)
    await report(100)
    await report(1_000, true)

    expect(progress.map((entry) => entry.simulatedMs)).toEqual([0, 250, 1_000])
    expect(progress.every((entry) => entry.totalMs === 1_000 && Number.isFinite(entry.realElapsedMs))).toBe(true)
  })
})
