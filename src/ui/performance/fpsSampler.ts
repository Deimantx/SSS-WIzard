export const FPS_UPDATE_INTERVAL_MS = 500
export const FPS_SMOOTHING_ALPHA = 0.3

export const calculateFps = (frameCount: number, elapsedMs: number) => {
  if (!Number.isFinite(frameCount) || frameCount <= 0 || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return null
  return Math.max(1, Math.round(frameCount * 1000 / elapsedMs))
}

/** Keeps the short raw sample responsive while reducing one-window hitch noise. */
export const smoothFps = (previous: number | null, latest: number | null, alpha = FPS_SMOOTHING_ALPHA) => {
  if (latest === null || !Number.isFinite(latest) || latest <= 0) return previous
  if (previous === null || !Number.isFinite(previous) || previous <= 0) return latest
  const safeAlpha = Number.isFinite(alpha) ? Math.min(1, Math.max(0, alpha)) : FPS_SMOOTHING_ALPHA
  return Math.max(1, Math.round(previous * (1 - safeAlpha) + latest * safeAlpha))
}

export const fpsTone = (fps: number | null): 'neutral' | 'warning' | 'danger' => fps === null || fps >= 55 ? 'neutral' : fps >= 40 ? 'warning' : 'danger'
