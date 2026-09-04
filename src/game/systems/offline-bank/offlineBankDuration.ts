export type OfflineBankUnit = 'minutes' | 'hours' | 'days'

const MILLISECONDS_PER_MINUTE = 60_000
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR

/**
 * Offline Bank has no authored gameplay capacity yet. This is only a finite,
 * safe-integer ceiling so debug input and persisted state can never become
 * NaN, Infinity, or an unsafe integer.
 */
export const OFFLINE_BANK_STORAGE_MAX_MS = Number.MAX_SAFE_INTEGER

const MILLISECONDS_BY_UNIT: Record<OfflineBankUnit, number> = {
  minutes: MILLISECONDS_PER_MINUTE,
  hours: MILLISECONDS_PER_HOUR,
  days: MILLISECONDS_PER_DAY,
}

export const OFFLINE_BANK_PRESETS = [
  { label: '+1 Hour', amount: 1, unit: 'hours' },
  { label: '+8 Hours', amount: 8, unit: 'hours' },
  { label: '+1 Day', amount: 1, unit: 'days' },
  { label: '+7 Days', amount: 7, unit: 'days' },
] as const satisfies readonly { label: string; amount: number; unit: OfflineBankUnit }[]

export const clampOfflineBankMs = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.min(OFFLINE_BANK_STORAGE_MAX_MS, Math.max(0, Math.floor(value)))
}

/** Converts tester-entered duration without allowing invalid values into state. */
export const toOfflineDurationMs = (amount: number, unit: OfflineBankUnit): number => {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return clampOfflineBankMs(amount * MILLISECONDS_BY_UNIT[unit])
}

export const addOfflineBankMs = (current: unknown, durationMs: unknown) => {
  const currentMs = clampOfflineBankMs(current)
  const amountMs = clampOfflineBankMs(durationMs)
  if (amountMs <= 0 || currentMs >= OFFLINE_BANK_STORAGE_MAX_MS - amountMs) return amountMs > 0 ? OFFLINE_BANK_STORAGE_MAX_MS : currentMs
  return currentMs + amountMs
}
