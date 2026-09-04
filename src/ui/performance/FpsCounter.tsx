import { Gauge } from 'lucide-react'
import { useEffect, useState } from 'react'
import { GameTooltip } from '../../components/ui/tooltip/Tooltip'
import { useUiPreferences } from '../preferences/uiPreferencesStore'
import { calculateFps, FPS_UPDATE_INTERVAL_MS, fpsTone, smoothFps } from './fpsSampler'

export function FpsCounter() {
  const { showFpsCounter } = useUiPreferences()
  const [fps, setFps] = useState<number | null>(null)
  const [latestSample, setLatestSample] = useState<number | null>(null)

  useEffect(() => {
    if (!showFpsCounter) {
      setFps(null)
      setLatestSample(null)
      return
    }
    let raf = 0
    let frames = 0
    let windowStart: number | null = null

    const reset = () => {
      frames = 0
      windowStart = null
      setFps(null)
      setLatestSample(null)
    }
    const sample = (timestamp: number) => {
      if (document.hidden) {
        raf = 0
        reset()
        return
      }
      if (windowStart === null) windowStart = timestamp
      frames += 1
      if (windowStart !== null && timestamp - windowStart >= FPS_UPDATE_INTERVAL_MS) {
        const latest = calculateFps(frames, timestamp - windowStart)
        setLatestSample(latest)
        setFps((previous) => smoothFps(previous, latest))
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
  const frameTimeFps = latestSample ?? fps
  return <GameTooltip content={<span>FPS<br />Smoothed {fps}<br />Latest sample {latestSample ?? '—'}<br />Frame time ~{(1000 / frameTimeFps).toFixed(1)} ms</span>}>
    <span className={`fps-counter fps-${tone}`} aria-label={`Current performance: ${fps} FPS`}><Gauge size={13} aria-hidden="true" /><strong>{fps}</strong><small>FPS</small></span>
  </GameTooltip>
}
