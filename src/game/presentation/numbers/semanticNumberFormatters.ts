const INVALID_NUMBER_LABEL = '—'

const integerFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })
const oneDecimalFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 0 })

const safeNonNegative = (value: number) => Number.isFinite(value) ? Math.max(0, value) : null

/** Format a player-facing integer count without compact K/M notation. */
export const formatUiCount = (value: number): string => {
  const safe = safeNonNegative(value)
  return safe === null ? INVALID_NUMBER_LABEL : integerFormatter.format(Math.round(safe))
}

/** Format a non-negative throughput metric, rounding positive fractional values upward. */
export const formatUiRate = (value: number, suffix = ''): string => {
  const safe = safeNonNegative(value)
  if (safe === null) return INVALID_NUMBER_LABEL
  const formatted = integerFormatter.format(Math.ceil(safe))
  return suffix ? `${formatted} ${suffix}` : formatted
}

/** Combat throughput uses the same upward-rounded whole-number convention as other rates. */
export const formatUiCombatRate = (value: number, suffix = '') => formatUiRate(value, suffix)

/** Format an analysis percentage with useful precision while removing unnecessary .0. */
export const formatUiPercent = (value: number): string => {
  const safe = safeNonNegative(value)
  if (safe === null) return INVALID_NUMBER_LABEL
  if (safe > 0 && safe < 0.1) return '<0.1%'
  return `${oneDecimalFormatter.format(safe)}%`
}

/** Format a combat duration in seconds, preserving meaningful sub-second precision. */
export const formatUiDuration = (seconds: number): string => {
  const safe = safeNonNegative(seconds)
  if (safe === null) return INVALID_NUMBER_LABEL
  if (safe < 60) return `${oneDecimalFormatter.format(safe)}s`

  const total = Math.floor(safe)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainder = total % 60
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}
