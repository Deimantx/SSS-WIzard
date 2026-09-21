import { useSyncExternalStore } from 'react'
import { subscribeCombatVisualFrame } from './combatVisualClock'

export const COMBAT_PERFORMANCE_TOGGLE_LABELS = {
  ambient: 'Combat Ambient',
  floatingFeedback: 'Floating Feedback',
  statusTimerRings: 'Status Timer Rings',
  patternProgress: 'Pattern Progress',
  cooldownOverlays: 'Spell Cooldown Overlays',
  combatAnalytics: 'Combat Analytics panel',
  dungeonStatistics: 'Dungeon Statistics panel',
} as const

export type CombatPerformanceToggleId = keyof typeof COMBAT_PERFORMANCE_TOGGLE_LABELS
export type CombatPerformanceToggles = Record<CombatPerformanceToggleId, boolean>

const defaultToggles: CombatPerformanceToggles = {
  ambient: true,
  floatingFeedback: true,
  statusTimerRings: true,
  patternProgress: true,
  cooldownOverlays: true,
  combatAnalytics: true,
  dungeonStatistics: true,
}

let toggles = { ...defaultToggles }
const toggleListeners = new Set<() => void>()
const notifyToggles = () => toggleListeners.forEach((listener) => listener())

export const getCombatPerformanceToggles = () => toggles
export const setCombatPerformanceToggle = (id: CombatPerformanceToggleId, enabled: boolean) => {
  if (toggles[id] === enabled) return
  toggles = { ...toggles, [id]: enabled }
  notifyToggles()
}
export const resetCombatPerformanceToggles = () => {
  toggles = { ...defaultToggles }
  notifyToggles()
}

export const useCombatPerformanceToggles = () => useSyncExternalStore((listener) => {
  toggleListeners.add(listener)
  return () => toggleListeners.delete(listener)
}, getCombatPerformanceToggles, () => defaultToggles)

export const useCombatPerformanceToggle = (id: CombatPerformanceToggleId) => {
  const enabled = useSyncExternalStore((listener) => {
    toggleListeners.add(listener)
    return () => toggleListeners.delete(listener)
  }, () => toggles[id], () => true)
  return enabled
}

export interface CombatPerformanceMetrics {
  currentFps: number | null
  averageFps1s: number | null
  averageFps5s: number | null
  worstFrameMs: number | null
  approxOnePercentLow: number | null
  framesOver16_7ms: number
  framesOver20ms: number
  framesOver33ms: number
}

const emptyMetrics: CombatPerformanceMetrics = { currentFps: null, averageFps1s: null, averageFps5s: null, worstFrameMs: null, approxOnePercentLow: null, framesOver16_7ms: 0, framesOver20ms: 0, framesOver33ms: 0 }
let metrics = emptyMetrics
let frameSamples: Array<{ timestamp: number; durationMs: number }> = []
let previousTimestamp: number | null = null
let lastPublishedAt = 0
let metricsStop: (() => void) | null = null
const metricsListeners = new Set<() => void>()

const fpsForWindow = (samples: Array<{ timestamp: number; durationMs: number }>, durationMs: number, now: number) => {
  const recent = samples.filter((sample) => sample.timestamp >= now - durationMs)
  if (recent.length === 0) return null
  const elapsed = Math.max(1, Math.min(durationMs, now - recent[0].timestamp + recent[recent.length - 1].durationMs))
  return Math.max(1, Math.round(recent.length * 1000 / elapsed))
}

const publishMetrics = (timestamp: number) => {
  const oneSecond = frameSamples.filter((sample) => sample.timestamp >= timestamp - 1_000)
  const fiveSeconds = frameSamples.filter((sample) => sample.timestamp >= timestamp - 5_000)
  const sorted = [...fiveSeconds].sort((left, right) => right.durationMs - left.durationMs)
  const onePercentCount = Math.max(1, Math.ceil(sorted.length * 0.01))
  const onePercentDuration = sorted.length ? sorted.slice(0, onePercentCount).reduce((total, sample) => total + sample.durationMs, 0) / onePercentCount : 0
  metrics = {
    currentFps: fpsForWindow(oneSecond, 1_000, timestamp),
    averageFps1s: fpsForWindow(oneSecond, 1_000, timestamp),
    averageFps5s: fpsForWindow(fiveSeconds, 5_000, timestamp),
    worstFrameMs: sorted[0]?.durationMs ?? null,
    approxOnePercentLow: onePercentDuration > 0 ? Math.max(1, Math.round(1000 / onePercentDuration)) : null,
    framesOver16_7ms: fiveSeconds.filter((sample) => sample.durationMs > 16.7).length,
    framesOver20ms: fiveSeconds.filter((sample) => sample.durationMs > 20).length,
    framesOver33ms: fiveSeconds.filter((sample) => sample.durationMs > 33).length,
  }
  metricsListeners.forEach((listener) => listener())
}

const onVisualFrame = (timestamp: number) => {
  if (previousTimestamp !== null) {
    const durationMs = timestamp - previousTimestamp
    if (durationMs > 0 && durationMs < 1_000) frameSamples.push({ timestamp, durationMs })
  }
  previousTimestamp = timestamp
  frameSamples = frameSamples.filter((sample) => sample.timestamp >= timestamp - 5_000)
  if (timestamp - lastPublishedAt >= 500) {
    lastPublishedAt = timestamp
    publishMetrics(timestamp)
  }
}

const startMetrics = () => {
  if (metricsStop || !import.meta.env.DEV) return
  previousTimestamp = null
  frameSamples = []
  lastPublishedAt = 0
  metricsStop = subscribeCombatVisualFrame(onVisualFrame)
}

const stopMetrics = () => {
  metricsStop?.()
  metricsStop = null
  previousTimestamp = null
  frameSamples = []
  metrics = emptyMetrics
}

export const getCombatPerformanceMetrics = () => metrics
export const useCombatPerformanceMetrics = () => useSyncExternalStore((listener) => {
  metricsListeners.add(listener)
  startMetrics()
  return () => {
    metricsListeners.delete(listener)
    if (metricsListeners.size === 0) stopMetrics()
  }
}, getCombatPerformanceMetrics, () => emptyMetrics)

const renderCounts = new Map<string, { count: number; startedAt: number }>()
export const recordCombatRender = (name: string) => {
  if (!import.meta.env.DEV) return
  const current = renderCounts.get(name) ?? { count: 0, startedAt: performance.now() }
  current.count += 1
  renderCounts.set(name, current)
}
export const getCombatRenderRates = () => {
  const now = performance.now()
  return Object.fromEntries([...renderCounts.entries()].map(([name, value]) => [name, value.count / Math.max(1, (now - value.startedAt) / 1000)])) as Record<string, number>
}

