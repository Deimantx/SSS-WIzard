import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { formatTime } from '../../game/utils'
import {
  getCombatVisualTimelineProgress,
  reconcileCombatTimelineSnapshot,
  sampleCombatVisualTimeline,
  type CombatTimelineSnapshot,
  type CombatVisualTimelineState,
} from './performance/combatTimeline'
import { registerCombatVisualTimeline, subscribeCombatVisualFrame } from './performance/combatVisualClock'
import { recordCombatTimelineReconciliation } from './performance/combatPerformanceDiagnostics'

export interface CombatTimelineRef {
  current: CombatVisualTimelineState | null
  lastReconciliation: ReturnType<typeof reconcileCombatTimelineSnapshot> | null
}

export const createCombatTimelineRef = (): CombatTimelineRef => ({ current: null, lastReconciliation: null })

export interface CombatActionProgressProps extends CombatTimelineSnapshot {
  className?: string
  timelineRef?: CombatTimelineRef
}

const readNow = () => typeof performance !== 'undefined' ? performance.now() : 0

/** Reconciles authoritative snapshots without turning routine timer ticks into anchor resets. */
export function useCombatVisualTimeline(snapshot: CombatTimelineSnapshot, providedRef?: CombatTimelineRef) {
  const localRef = useRef<CombatTimelineRef | null>(null)
  if (!localRef.current) localRef.current = providedRef ?? createCombatTimelineRef()
  const timelineRef = providedRef ?? localRef.current

  useLayoutEffect(() => {
    const now = readNow()
    const result = reconcileCombatTimelineSnapshot(timelineRef.current, snapshot, now)
    timelineRef.current = result.state
    timelineRef.lastReconciliation = result
    recordCombatTimelineReconciliation(result, now)
  }, [snapshot.cycleId, snapshot.baseWorkMs, snapshot.remainingWorkMs, snapshot.rate, snapshot.blocked, snapshot.snapshotAtMs, timelineRef])

  useEffect(() => registerCombatVisualTimeline(timelineRef), [timelineRef])

  return timelineRef
}

const paintTimeline = (element: HTMLElement | null, timelineRef: CombatTimelineRef, timestamp: number) => {
  if (!element || !timelineRef.current) return
  const progress = getCombatVisualTimelineProgress(timelineRef.current, timestamp)
  element.style.setProperty('transform', `scaleX(${progress})`)
}

/** Direct-DOM visual fill. The shared RAF never writes GameStore or React state. */
export function CombatTimelineFill({ className = '', style, timelineRef, ...snapshot }: CombatActionProgressProps & { style?: CSSProperties }) {
  if (timelineRef) return <CombatTimelineFillShared className={className} style={style} timelineRef={timelineRef} snapshot={snapshot} />
  return <CombatTimelineFillOwned className={className} style={style} snapshot={snapshot} />
}

function CombatTimelineFillOwned({ className, style, snapshot }: { className: string; style?: CSSProperties; snapshot: CombatTimelineSnapshot }) {
  const timelineRef = useCombatVisualTimeline(snapshot)
  return <CombatTimelineFillShared className={className} style={style} timelineRef={timelineRef} snapshot={snapshot} />
}

function CombatTimelineFillShared({ className, style, timelineRef, snapshot }: { className: string; style?: CSSProperties; timelineRef: CombatTimelineRef; snapshot: CombatTimelineSnapshot }) {
  const fillRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const reconciliation = timelineRef.lastReconciliation
    if (reconciliation?.requiresImmediatePaint) paintTimeline(fillRef.current, timelineRef, readNow())
  }, [snapshot.cycleId, snapshot.baseWorkMs, snapshot.remainingWorkMs, snapshot.rate, snapshot.blocked, snapshot.snapshotAtMs, timelineRef])

  useEffect(() => subscribeCombatVisualFrame((timestamp) => paintTimeline(fillRef.current, timelineRef, timestamp)), [timelineRef])

  return <i ref={fillRef} className={className} style={style} />
}

/** A low-frequency direct-DOM readout using the same visual timeline as its fill. */
export function CombatTimelineReadout({ timelineRef, mode, totalWorkMs, className = '', fallback }: { timelineRef: CombatTimelineRef; mode: 'remaining' | 'elapsed' | 'eta'; totalWorkMs?: number; className?: string; fallback: string }) {
  const readoutRef = useRef<HTMLSpanElement>(null)
  const writeReadout = (timestamp: number) => {
    const state = timelineRef.current
    if (!state || !readoutRef.current) return
    const remaining = sampleCombatVisualTimeline(state, timestamp)
    if ((state.blocked || state.rate <= 0) && mode === 'eta') {
      readoutRef.current.textContent = fallback
      return
    }
    const value = mode === 'remaining'
      ? remaining
      : mode === 'elapsed'
        ? Math.max(0, (totalWorkMs ?? state.baseWorkMs) - remaining)
        : remaining / state.rate
    readoutRef.current.textContent = formatTime(value)
  }

  useLayoutEffect(() => { writeReadout(readNow()) }, [fallback, mode, timelineRef, totalWorkMs])
  useEffect(() => {
    let lastWriteAt = -Infinity
    return subscribeCombatVisualFrame((timestamp) => {
      if (timestamp - lastWriteAt < 50) return
      lastWriteAt = timestamp
      writeReadout(timestamp)
    })
  }, [fallback, mode, timelineRef, totalWorkMs])

  return <span ref={readoutRef} className={className}>{fallback}</span>
}

/** Combat-only progress track driven by the presentation clock. */
export function CombatActionProgress({ className = '', timelineRef, ...snapshot }: CombatActionProgressProps) {
  return <div className={`progress-wrap combat-action-progress ${className}`}><div className="progress"><CombatTimelineFill {...snapshot} timelineRef={timelineRef} /></div></div>
}
