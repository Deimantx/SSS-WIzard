import { useEffect, type RefObject } from 'react'

export function usePanelNaturalHeight(ref: RefObject<HTMLDivElement | null>, enabled: boolean, onHeightChange?: (height: number) => void) {
  useEffect(() => {
    const target = ref.current
    if (!target || !enabled || !onHeightChange) return
    const report = () => onHeightChange(target.getBoundingClientRect().height || target.scrollHeight)
    report()
    if (typeof ResizeObserver === 'undefined') return
    let frame: number | null = null
    const observer = new ResizeObserver(() => {
      if (frame !== null) cancelAnimationFrame(frame)
      const notify = () => { frame = null; report() }
      if (typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(notify)
      else notify()
    })
    observer.observe(target)
    return () => { if (frame !== null) cancelAnimationFrame(frame); observer.disconnect() }
  }, [enabled, onHeightChange, ref])
}
