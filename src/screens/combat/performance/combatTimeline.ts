export interface CombatTimelineSnapshot {
  cycleId?: string | number | null
  baseWorkMs: number
  remainingWorkMs: number
  rate: number
  blocked?: boolean
}

export interface CombatTimelineAnchor {
  snapshot: CombatTimelineSnapshot
  anchoredAtMs: number
}

const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback

export const getCombatTimelineProgress = (snapshot: CombatTimelineSnapshot, nowMs: number, anchor?: CombatTimelineAnchor | null) => {
  const baseWorkMs = Math.max(0.0001, finite(snapshot.baseWorkMs, 0.0001))
  const remainingWorkMs = Math.max(0, finite(snapshot.remainingWorkMs, baseWorkMs))
  const rate = snapshot.blocked ? 0 : Math.max(0, finite(snapshot.rate, 0))
  const elapsedMs = anchor && Number.isFinite(nowMs) && Number.isFinite(anchor.anchoredAtMs)
    ? Math.max(0, nowMs - anchor.anchoredAtMs)
    : 0
  const estimatedRemainingWorkMs = Math.max(0, remainingWorkMs - elapsedMs * rate)
  return Math.max(0, Math.min(1, 1 - estimatedRemainingWorkMs / baseWorkMs))
}

export const getCombatTimelineRemainingWork = (snapshot: CombatTimelineSnapshot, nowMs: number, anchor?: CombatTimelineAnchor | null) => {
  const baseWorkMs = Math.max(0.0001, finite(snapshot.baseWorkMs, 0.0001))
  const remainingWorkMs = Math.max(0, finite(snapshot.remainingWorkMs, baseWorkMs))
  const rate = snapshot.blocked ? 0 : Math.max(0, finite(snapshot.rate, 0))
  const elapsedMs = anchor && Number.isFinite(nowMs) && Number.isFinite(anchor.anchoredAtMs)
    ? Math.max(0, nowMs - anchor.anchoredAtMs)
    : 0
  return Math.max(0, Math.min(baseWorkMs, remainingWorkMs - elapsedMs * rate))
}

export const getCombatVisualRate = (baseRate: number, paused: boolean, timeScale: number) => {
  if (paused) return 0
  const safeScale = [0.25, 0.5, 1, 2, 5].includes(timeScale) ? timeScale : 1
  return Number.isFinite(baseRate) && baseRate > 0 ? baseRate * safeScale : 0
}

