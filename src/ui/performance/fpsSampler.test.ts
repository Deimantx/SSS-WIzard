import { describe, expect, it } from 'vitest'
import { calculateFps, fpsTone, smoothFps } from './fpsSampler'

describe('FPS presentation helpers', () => {
  it('calculates the displayed cadence from sampled frames', () => {
    expect(calculateFps(60, 1000)).toBe(60)
    expect(calculateFps(72, 500)).toBe(144)
    expect(calculateFps(0, 500)).toBeNull()
    expect(calculateFps(72, 0)).toBeNull()
  })

  it('supports high-refresh samples without an artificial 60 FPS cap', () => {
    expect(calculateFps(72, 500)).toBe(144)
  })

  it('smooths a short hitch while converging on sustained slowdown', () => {
    expect(smoothFps(null, 144)).toBe(144)
    expect(smoothFps(144, 80)).toBe(125)
    const afterSlowdown = smoothFps(smoothFps(smoothFps(144, 45), 45), 45)
    expect(afterSlowdown).toBe(79)
    expect(smoothFps(100, null)).toBe(100)
    expect(smoothFps(100, 144, 1)).toBe(144)
  })

  it('uses readable performance thresholds', () => {
    expect(fpsTone(60)).toBe('neutral')
    expect(fpsTone(45)).toBe('warning')
    expect(fpsTone(24)).toBe('danger')
  })
})
