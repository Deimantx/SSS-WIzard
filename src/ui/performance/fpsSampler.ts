export const FPS_UPDATE_INTERVAL_MS = 500

export const calculateFps = (frameCount: number, elapsedMs: number) => {
  if (!Number.isFinite(frameCount) || frameCount <= 0 || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return null
  return Math.max(1, Math.round(frameCount * 1000 / elapsedMs))
}

export const fpsTone = (fps: number | null): 'neutral' | 'warning' | 'danger' => fps === null || fps >= 55 ? 'neutral' : fps >= 40 ? 'warning' : 'danger'
