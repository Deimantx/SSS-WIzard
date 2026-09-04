import { Gauge } from 'lucide-react'
import { useEffect, useState } from 'react'
import { GameTooltip } from '../../components/ui/tooltip/Tooltip'
import { useUiPreferences } from '../preferences/uiPreferencesStore'
import { calculateFps, FPS_UPDATE_INTERVAL_MS, fpsTone } from './fpsSampler'

export function FpsCounter() {
  const { showFpsCounter } = useUiPreferences()
  const [fps, setFps] = useState<number | null>(null)

  useEffect(() => {
    if (!showFpsCounter) {
      setFps(null)
      return
    }
    let raf = 0
    let frames = 0
    let windowStart: number | null = null

    const reset = () => {
      frames = 0
      windowStart = null
      setFps(null)
    }
    const sample = (timestamp: number) => {
      if (document.hidden) {
        reset()
        return
      }
      if (windowStart === null) windowStart = timestamp
      frames += 1
      if (windowStart !== null && timestamp - windowStart >= FPS_UPDATE_INTERVAL_MS) {
        setFps(calculateFps(frames, timestamp - windowStart))
        frames = 0
        windowStart = timestamp
      }
      raf = window.requestAnimationFrame(sample)
    }
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (raf) window.cancelAnimationFrame(raf)
        raf = 0
        reset()
      } else if (!raf) {
        raf = window.requestAnimationFrame(sample)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    if (!document.hidden) raf = window.requestAnimationFrame(sample)
    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [showFpsCounter])

  if (!showFpsCounter || fps === null) return null
  const tone = fpsTone(fps)
  return <GameTooltip content={<span>FPS<br />Current {fps}<br />Frame time ~{(1000 / fps).toFixed(1)} ms</span>}>
    <span className={`fps-counter fps-${tone}`} aria-label={`Current performance: ${fps} FPS`}><Gauge size={13} aria-hidden="true" /><strong>{fps}</strong><small>FPS</small></span>
  </GameTooltip>
}
