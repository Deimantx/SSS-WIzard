export const getCooldownFraction = (cooldownRemainingMs: number, cooldownDurationMs: number) => {
  if (!Number.isFinite(cooldownRemainingMs) || cooldownRemainingMs <= 0) return 0
  if (!Number.isFinite(cooldownDurationMs) || cooldownDurationMs <= 0) return 0
  return Math.max(0, Math.min(1, cooldownRemainingMs / cooldownDurationMs))
}

export const formatCooldownNumber = (cooldownRemainingMs: number) => {
  const seconds = Math.max(0, cooldownRemainingMs) / 1000
  if (seconds <= 0) return ''
  if (seconds >= 10) return `${Math.ceil(seconds)}`
  return seconds.toFixed(1)
}
