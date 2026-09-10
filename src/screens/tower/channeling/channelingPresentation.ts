export function formatChannelingRate(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, '')
}

export function formatChannelingPercent(multiplier: number) {
  return `+${Math.round((multiplier - 1) * 100)}%`
}
