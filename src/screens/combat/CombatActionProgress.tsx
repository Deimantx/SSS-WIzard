import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { getCombatTimelineProgress, type CombatTimelineSnapshot } from './performance/combatTimeline'
import { subscribeCombatVisualFrame } from './performance/combatVisualClock'

export const shouldResetCombatActionProgress = (previous: number, next: number, _cycleChanged = true) => next < previous - 0.01

export interface CombatActionProgressProps extends CombatTimelineSnapshot {
  className?: string
}

const readNow = () => typeof performance !== 'undefined' ? performance.now() : 0

/**
 * Direct-DOM visual fill. React only re-anchors this fill when authoritative
 * combat data changes; the shared RAF updates the compositor-friendly value.
 */
export function CombatTimelineFill({ className = '', style, ...snapshot }: CombatActionProgressProps & { style?: CSSProperties }) {
  const fillRef = useRef<HTMLElement>(null)
  const anchorRef = useRef<{ snapshot: CombatTimelineSnapshot; anchoredAtMs: number } | null>(null)

  useLayoutEffect(() => {
    const anchoredAtMs = readNow()
    anchorRef.current = { snapshot, anchoredAtMs }
    const progress = getCombatTimelineProgress(snapshot, anchoredAtMs, anchorRef.current)
    fillRef.current?.style.setProperty('transform', `scaleX(${progress})`)
  }, [snapshot.cycleId, snapshot.baseWorkMs, snapshot.remainingWorkMs, snapshot.rate, snapshot.blocked])

  useEffect(() => subscribeCombatVisualFrame((timestamp) => {
    const anchor = anchorRef.current
    if (!anchor || !fillRef.current) return
    const progress = getCombatTimelineProgress(anchor.snapshot, timestamp, anchor)
    fillRef.current.style.setProperty('transform', `scaleX(${progress})`)
  }), [])

  return <i ref={fillRef} className={className} style={style} />
}

/** Combat-only progress track driven by the presentation clock. */
export function CombatActionProgress({ className = '', ...snapshot }: CombatActionProgressProps) {
  return <div className={`progress-wrap combat-action-progress ${className}`}><div className="progress"><CombatTimelineFill {...snapshot} /></div></div>
}
