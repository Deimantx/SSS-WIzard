import { useEffect, useRef, useState } from 'react'

export const shouldResetCombatActionProgress = (previous: number, next: number, cycleChanged = true) => next < previous - 0.01 && cycleChanged

/** Combat-only progress track with a snap on action-cycle wrap. */
export function CombatActionProgress({ value, cycleId, className = '' }: { value: number; cycleId?: string | null; className?: string }) {
  const previous = useRef<{ value: number; cycleId?: string | null } | null>(null)
  const [reset, setReset] = useState(false)
  useEffect(() => {
    const prior = previous.current
    previous.current = { value, cycleId }
    if (!prior) return
    const cycleChanged = cycleId === undefined || prior.cycleId !== cycleId
    if (!shouldResetCombatActionProgress(prior.value, value, cycleChanged)) return
    setReset(true)
    let frame = 0
    let timeout = 0
    const release = () => setReset(false)
    if (typeof window.requestAnimationFrame === 'function') frame = window.requestAnimationFrame(release)
    else timeout = window.setTimeout(release, 0)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      if (timeout) window.clearTimeout(timeout)
    }
  }, [cycleId, value])
  const safeValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  return <div className={`progress-wrap combat-action-progress ${className}`}><div className="progress"><i className={reset ? 'is-reset' : undefined} style={{ width: `${safeValue}%` }} /></div></div>
}
