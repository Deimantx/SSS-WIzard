export const RESOURCE_EPSILON = 1e-6

export const stabilizeResourceValue = (value: number, precision = 1_000_000) => {
  if (!Number.isFinite(value)) return 0
  const rounded = Math.round(value * precision) / precision
  return Math.abs(rounded) < RESOURCE_EPSILON ? 0 : rounded
}

export const formatResourceAmount = (value: number, maxDecimals = 2) => new Intl.NumberFormat('en-US', {
  maximumFractionDigits: maxDecimals,
  minimumFractionDigits: 0,
}).format(stabilizeResourceValue(value))

export const hasEnoughResource = (current: number, required: number) => (
  stabilizeResourceValue(current) + RESOURCE_EPSILON >= stabilizeResourceValue(required)
)
