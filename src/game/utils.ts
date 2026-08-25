export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
export const formatNumber = (value: number) => {
  if (Math.abs(value) < 10_000) return Math.floor(value).toLocaleString()
  if (Math.abs(value) < 1_000_000) return `${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1)}K`
  return `${(value / 1_000_000).toFixed(2)}M`
}
export const formatTime = (ms: number) => {
  const seconds = Math.max(0, ms) / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
export const formatOfflineBank = (ms: number) => {
  const totalMinutes = Math.floor((Number.isFinite(ms) ? Math.max(0, ms) : 0) / 60_000)
  if (totalMinutes < 1) return '<1m'
  const hours = Math.floor(totalMinutes / 60)
  if (hours < 24) return hours ? `${hours}h ${String(totalMinutes % 60).padStart(2, '0')}m` : `${totalMinutes}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}
export const formatCompactDuration = (ms: number) => {
  const seconds = Math.max(0, ms) / 1000
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${String(Math.floor(seconds % 60)).padStart(2, '0')}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`
}
export const formatRatePerHour = (value: number) => {
  const safe = Math.max(0, value)
  if (safe >= 1000) return `${(safe / 1000).toFixed(safe >= 10_000 ? 0 : 1)}k/h`
  return `${Math.round(safe).toLocaleString()}/h`
}
export const formatSignedRate = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(Math.abs(value) >= 10 ? 1 : 2).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')}/s`
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
