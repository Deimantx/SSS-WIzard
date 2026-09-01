import { useLayoutEffect, useRef, useState } from 'react'

export const shouldResetCombatActionProgress = (previous: number, next: number, _cycleChanged = true) => next < previous - 0.01

/** Combat-only progress track with a snap on action-cycle wrap. */
export function CombatActionProgress({ value, cycleId: _cycleId, className = '' }: { value: number; cycleId?: string | null; className?: string }) {
  const previous = useRef<number | null>(null)
  const [reset, setReset] = useState(false)
  const safeValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  const movingBackward = previous.current !== null && shouldResetCombatActionProgress(previous.current, safeValue)
  useLayoutEffect(() => {
    previous.current = safeValue
    if (!movingBackward) {
      setReset(false)
      return
    }
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
  }, [safeValue])
  return <div className={`progress-wrap combat-action-progress ${className}`}><div className="progress"><i className={reset || movingBackward ? 'is-reset' : undefined} style={{ width: `${safeValue}%` }} /></div></div>
}
