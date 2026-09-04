import { describe, expect, it } from 'vitest'
import { addOfflineBankMs, clampOfflineBankMs, OFFLINE_BANK_PRESETS, OFFLINE_BANK_STORAGE_MAX_MS, toOfflineDurationMs } from './offlineBankDuration'

describe('Offline Bank duration helpers', () => {
  it('converts minutes, hours, and days through one canonical conversion', () => {
    expect(toOfflineDurationMs(12, 'minutes')).toBe(12 * 60_000)
    expect(toOfflineDurationMs(2, 'hours')).toBe(2 * 60 * 60_000)
    expect(toOfflineDurationMs(3, 'days')).toBe(3 * 24 * 60 * 60_000)
  })

  it('defines the required preset durations', () => {
    expect(OFFLINE_BANK_PRESETS.map((preset) => toOfflineDurationMs(preset.amount, preset.unit))).toEqual([
      60 * 60_000,
      8 * 60 * 60_000,
      24 * 60 * 60_000,
      7 * 24 * 60 * 60_000,
    ])
  })

  it('sanitizes invalid values and clamps additions at the safe storage ceiling', () => {
    expect(toOfflineDurationMs(-1, 'hours')).toBe(0)
    expect(toOfflineDurationMs(Number.NaN, 'hours')).toBe(0)
    expect(toOfflineDurationMs(Number.POSITIVE_INFINITY, 'hours')).toBe(0)
    expect(clampOfflineBankMs(-4.8)).toBe(0)
    expect(clampOfflineBankMs(Number.POSITIVE_INFINITY)).toBe(0)
    expect(clampOfflineBankMs(OFFLINE_BANK_STORAGE_MAX_MS + 1)).toBe(OFFLINE_BANK_STORAGE_MAX_MS)
    expect(addOfflineBankMs(OFFLINE_BANK_STORAGE_MAX_MS - 1, 60_000)).toBe(OFFLINE_BANK_STORAGE_MAX_MS)
    expect(addOfflineBankMs(12_000, Number.NaN)).toBe(12_000)
  })
})
