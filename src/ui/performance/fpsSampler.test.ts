import { describe, expect, it } from 'vitest'
import { calculateFps, fpsTone } from './fpsSampler'

describe('FPS presentation helpers', () => {
  it('calculates the displayed cadence from sampled frames', () => {
    expect(calculateFps(60, 1000)).toBe(60)
    expect(calculateFps(72, 500)).toBe(144)
    expect(calculateFps(0, 500)).toBeNull()
  })

  it('uses readable performance thresholds', () => {
    expect(fpsTone(60)).toBe('neutral')
    expect(fpsTone(45)).toBe('warning')
    expect(fpsTone(24)).toBe('danger')
  })
})
