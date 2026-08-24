import { describe, expect, it } from 'vitest'
import { formatOfflineBank } from './utils'

describe('formatOfflineBank', () => {
  it.each([
    [0, '<1m'], [11_100, '<1m'], [60_000, '1m'], [59 * 60_000, '59m'], [60 * 60_000, '1h 00m'], [(2 * 60 + 14) * 60_000, '2h 14m'], [(24 + 3) * 60 * 60_000, '1d 3h'],
  ])('formats %s as %s', (ms, expected) => expect(formatOfflineBank(ms)).toBe(expected))
})
