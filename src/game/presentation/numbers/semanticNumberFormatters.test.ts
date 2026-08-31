import { describe, expect, it } from 'vitest'
import { formatUiCombatRate, formatUiCount, formatUiDuration, formatUiPercent, formatUiRate } from './semanticNumberFormatters'

describe('semantic UI number formatters', () => {
  it('formats counts as grouped whole integers', () => {
    expect(formatUiCount(17)).toBe('17')
    expect(formatUiCount(1_502.4)).toBe('1,502')
    expect(formatUiCount(Number.NaN)).toBe('—')
    expect(formatUiCount(Number.POSITIVE_INFINITY)).toBe('—')
  })

  it('ceil-rounds throughput rates and preserves grouping', () => {
    expect(formatUiRate(0)).toBe('0')
    expect(formatUiRate(0.1)).toBe('1')
    expect(formatUiRate(29.5)).toBe('30')
    expect(formatUiRate(1_502)).toBe('1,502')
    expect(formatUiRate(1_502.1, '/h')).toBe('1,503 /h')
    expect(formatUiCombatRate(29.01, '/s')).toBe('30 /s')
  })

  it('keeps useful percentage precision and removes trailing zeroes', () => {
    expect(formatUiPercent(73.8)).toBe('73.8%')
    expect(formatUiPercent(74)).toBe('74%')
    expect(formatUiPercent(5.04)).toBe('5%')
    expect(formatUiPercent(0)).toBe('0%')
    expect(formatUiPercent(Number.NaN)).toBe('—')
  })

  it('strips unnecessary duration decimals without rounding away tactical precision', () => {
    expect(formatUiDuration(15)).toBe('15s')
    expect(formatUiDuration(15.6)).toBe('15.6s')
    expect(formatUiDuration(0.8)).toBe('0.8s')
    expect(formatUiDuration(75.6)).toBe('01:15')
    expect(formatUiDuration(Number.POSITIVE_INFINITY)).toBe('—')
  })
})
