export const COMBAT_TIMELINE_SMALL_DRIFT_MS = 24
export const COMBAT_TIMELINE_MEDIUM_DRIFT_MS = 80
export const COMBAT_TIMELINE_SOFT_CORRECTION_MS = 100
export const COMBAT_TIMELINE_COMPLETION_CAP = 0.998

export interface CombatTimelineSnapshot {
  cycleId?: string | number | null
  baseWorkMs: number
  remainingWorkMs: number
  rate: number
  blocked?: boolean
  /** Optional wall-clock timestamp for the authoritative simulation snapshot. */
  snapshotAtMs?: number | null
}

export interface CombatTimelineAnchor {
  snapshot: CombatTimelineSnapshot
  anchoredAtMs: number
}

export interface CombatVisualTimelineState {
  cycleId?: string | number | null
  baseWorkMs: number
  anchorRemainingWorkMs: number
  anchoredAtMs: number
  rate: number
  blocked: boolean
  lastVisualRemainingWorkMs: number
  lastAuthoritativeRemainingWorkMs: number
  lastSnapshotAtMs: number
  completionConfirmed: boolean
  correction: { deltaRemainingWorkMs: number; startedAtMs: number; durationMs: number } | null
}

export type CombatTimelineReconciliationKind =
  | 'initial'
  | 'normal-confirmation'
  | 'ignored-drift'
  | 'soft-correction'
  | 'cycle-reset'
  | 'rate-change'
  | 'pause-change'
  | 'timer-rebase'

export interface CombatTimelineReconciliation {
  state: CombatVisualTimelineState
  kind: CombatTimelineReconciliationKind
  driftMs: number
  hardReset: boolean
  softCorrection: boolean
  backwardCorrection: boolean
  requiresImmediatePaint: boolean
}

const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback
const safeNow = (value: number) => finite(value, 0)
const safeBase = (value: number) => Math.max(0.0001, finite(value, 0.0001))
const safeRemaining = (value: number, fallback: number) => Math.max(0, finite(value, fallback))
const safeRate = (snapshot: Pick<CombatTimelineSnapshot, 'rate' | 'blocked'>) => snapshot.blocked ? 0 : Math.max(0, finite(snapshot.rate, 0))
const sameIdentity = (left: string | number | null | undefined, right: string | number | null | undefined) => left === right

const snapshotTime = (snapshot: CombatTimelineSnapshot, nowMs: number) => {
  const candidate = snapshot.snapshotAtMs
  return Number.isFinite(candidate) ? Math.min(nowMs, Math.max(0, candidate as number)) : nowMs
}

const projectSnapshotToNow = (snapshot: CombatTimelineSnapshot, nowMs: number) => {
  const remaining = safeRemaining(snapshot.remainingWorkMs, safeBase(snapshot.baseWorkMs))
  const elapsed = Math.max(0, nowMs - snapshotTime(snapshot, nowMs))
  return Math.max(0, remaining - elapsed * safeRate(snapshot))
}

const sampleNaturalRemaining = (state: CombatVisualTimelineState, nowMs: number) => {
  const elapsed = Math.max(0, nowMs - state.anchoredAtMs)
  return Math.max(0, state.anchorRemainingWorkMs - (state.blocked ? 0 : elapsed * state.rate))
}

export const sampleCombatVisualTimeline = (state: CombatVisualTimelineState, nowMs: number) => {
  const now = safeNow(nowMs)
  const natural = sampleNaturalRemaining(state, now)
  const correction = state.correction
  if (!correction) return natural
  const progress = Math.max(0, Math.min(1, (now - correction.startedAtMs) / correction.durationMs))
  return Math.max(0, natural + correction.deltaRemainingWorkMs * progress)
}

export const getCombatVisualTimelineProgress = (state: CombatVisualTimelineState, nowMs: number) => {
  const remaining = sampleCombatVisualTimeline(state, nowMs)
  if (state.completionConfirmed && remaining <= 0) return 1
  const rawProgress = 1 - remaining / safeBase(state.baseWorkMs)
  return Math.max(0, Math.min(COMBAT_TIMELINE_COMPLETION_CAP, rawProgress))
}

const createState = (snapshot: CombatTimelineSnapshot, nowMs: number, remainingAtAnchor = projectSnapshotToNow(snapshot, nowMs), anchoredAtMs = nowMs): CombatVisualTimelineState => ({
  cycleId: snapshot.cycleId,
  baseWorkMs: safeBase(snapshot.baseWorkMs),
  anchorRemainingWorkMs: remainingAtAnchor,
  anchoredAtMs,
  rate: safeRate(snapshot),
  blocked: Boolean(snapshot.blocked),
  lastVisualRemainingWorkMs: remainingAtAnchor,
  lastAuthoritativeRemainingWorkMs: safeRemaining(snapshot.remainingWorkMs, safeBase(snapshot.baseWorkMs)),
  lastSnapshotAtMs: snapshotTime(snapshot, nowMs),
  completionConfirmed: safeRemaining(snapshot.remainingWorkMs, safeBase(snapshot.baseWorkMs)) <= 0,
  correction: null,
})

export const createCombatVisualTimeline = (snapshot: CombatTimelineSnapshot, nowMs: number) => {
  const now = safeNow(nowMs)
  const anchoredAt = snapshotTime(snapshot, now)
  const state = createState(snapshot, now, safeRemaining(snapshot.remainingWorkMs, safeBase(snapshot.baseWorkMs)), anchoredAt)
  state.lastVisualRemainingWorkMs = sampleCombatVisualTimeline(state, now)
  return state
}

const withCurrentSample = (state: CombatVisualTimelineState, nowMs: number, currentRemaining: number) => ({
  ...state,
  anchorRemainingWorkMs: currentRemaining,
  anchoredAtMs: nowMs,
  correction: null,
  lastVisualRemainingWorkMs: currentRemaining,
})

export const reconcileCombatTimelineSnapshot = (previous: CombatVisualTimelineState | null, snapshot: CombatTimelineSnapshot, nowMs: number): CombatTimelineReconciliation => {
  const now = safeNow(nowMs)
  if (!previous) {
    const state = createCombatVisualTimeline(snapshot, now)
    return { state, kind: 'initial', driftMs: 0, hardReset: true, softCorrection: false, backwardCorrection: false, requiresImmediatePaint: true }
  }

  const nextRate = safeRate(snapshot)
  const nextBlocked = Boolean(snapshot.blocked)
  const nextBase = safeBase(snapshot.baseWorkMs)
  const currentRemaining = sampleCombatVisualTimeline(previous, now)
  const identityChanged = !sameIdentity(previous.cycleId, snapshot.cycleId)
  const baseChanged = Math.abs(previous.baseWorkMs - nextBase) > 0.0001
  if (identityChanged || baseChanged) {
    const state = createState(snapshot, now)
    const authoritativeRemaining = projectSnapshotToNow(snapshot, now)
    return { state, kind: identityChanged ? 'cycle-reset' : 'timer-rebase', driftMs: authoritativeRemaining - currentRemaining, hardReset: true, softCorrection: false, backwardCorrection: authoritativeRemaining > currentRemaining + 0.01, requiresImmediatePaint: true }
  }

  const rateChanged = Math.abs(previous.rate - nextRate) > 0.0001
  const blockedChanged = previous.blocked !== nextBlocked
  if (rateChanged || blockedChanged) {
    const state = withCurrentSample({
      ...previous,
      cycleId: snapshot.cycleId,
      baseWorkMs: nextBase,
      rate: nextRate,
      blocked: nextBlocked,
      lastAuthoritativeRemainingWorkMs: safeRemaining(snapshot.remainingWorkMs, nextBase),
      lastSnapshotAtMs: snapshotTime(snapshot, now),
      completionConfirmed: safeRemaining(snapshot.remainingWorkMs, nextBase) <= 0,
    }, now, currentRemaining)
    return { state, kind: blockedChanged ? 'pause-change' : 'rate-change', driftMs: projectSnapshotToNow(snapshot, now) - currentRemaining, hardReset: false, softCorrection: false, backwardCorrection: false, requiresImmediatePaint: true }
  }

  const authoritativeRemaining = projectSnapshotToNow(snapshot, now)
  const driftMs = authoritativeRemaining - currentRemaining
  const driftWallMs = driftMs / Math.max(0.0001, nextRate || previous.rate || 1)
  const authoritativeRaw = safeRemaining(snapshot.remainingWorkMs, nextBase)
  const baseState = {
    ...previous,
    lastVisualRemainingWorkMs: currentRemaining,
    lastAuthoritativeRemainingWorkMs: authoritativeRaw,
    lastSnapshotAtMs: snapshotTime(snapshot, now),
    completionConfirmed: authoritativeRaw <= 0,
  }

  if (Math.abs(driftWallMs) <= COMBAT_TIMELINE_SMALL_DRIFT_MS) {
    return { state: baseState, kind: 'normal-confirmation', driftMs: driftWallMs, hardReset: false, softCorrection: false, backwardCorrection: false, requiresImmediatePaint: false }
  }

  if (driftMs < 0 && Math.abs(driftWallMs) <= COMBAT_TIMELINE_MEDIUM_DRIFT_MS) {
    const state = { ...baseState, correction: { deltaRemainingWorkMs: driftMs, startedAtMs: now, durationMs: COMBAT_TIMELINE_SOFT_CORRECTION_MS } }
    return { state, kind: 'soft-correction', driftMs: driftWallMs, hardReset: false, softCorrection: true, backwardCorrection: false, requiresImmediatePaint: false }
  }

  if (driftMs > 0 && driftWallMs <= COMBAT_TIMELINE_MEDIUM_DRIFT_MS) {
    return { state: baseState, kind: 'ignored-drift', driftMs: driftWallMs, hardReset: false, softCorrection: false, backwardCorrection: false, requiresImmediatePaint: false }
  }

  const state = createState(snapshot, now, authoritativeRemaining, now)
  return { state, kind: 'timer-rebase', driftMs: driftWallMs, hardReset: true, softCorrection: false, backwardCorrection: driftMs > 0, requiresImmediatePaint: true }
}

/** Compatibility math for callers/tests that only have one snapshot and an explicit anchor. */
export const getCombatTimelineProgress = (snapshot: CombatTimelineSnapshot, nowMs: number, anchor?: CombatTimelineAnchor | null) => {
  const baseWorkMs = safeBase(snapshot.baseWorkMs)
  const remainingWorkMs = safeRemaining(snapshot.remainingWorkMs, baseWorkMs)
  const rate = safeRate(snapshot)
  const elapsedMs = anchor && Number.isFinite(nowMs) && Number.isFinite(anchor.anchoredAtMs) ? Math.max(0, nowMs - anchor.anchoredAtMs) : 0
  const estimatedRemainingWorkMs = Math.max(0, remainingWorkMs - elapsedMs * rate)
  return Math.max(0, Math.min(1, 1 - estimatedRemainingWorkMs / baseWorkMs))
}

export const getCombatTimelineRemainingWork = (snapshot: CombatTimelineSnapshot, nowMs: number, anchor?: CombatTimelineAnchor | null) => {
  const baseWorkMs = safeBase(snapshot.baseWorkMs)
  const remainingWorkMs = safeRemaining(snapshot.remainingWorkMs, baseWorkMs)
  const rate = safeRate(snapshot)
  const elapsedMs = anchor && Number.isFinite(nowMs) && Number.isFinite(anchor.anchoredAtMs) ? Math.max(0, nowMs - anchor.anchoredAtMs) : 0
  return Math.max(0, remainingWorkMs - elapsedMs * rate)
}

export const getCombatVisualRate = (baseRate: number, paused: boolean, timeScale: number) => {
  if (paused) return 0
  const safeScale = [0.25, 0.5, 1, 2, 5].includes(timeScale) ? timeScale : 1
  return Number.isFinite(baseRate) && baseRate > 0 ? baseRate * safeScale : 0
}
