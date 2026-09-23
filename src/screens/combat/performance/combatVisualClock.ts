export type CombatVisualFrameSubscriber = (timestamp: number) => void

interface CombatVisualSubscriberEntry {
  callback: CombatVisualFrameSubscriber
  minIntervalMs: number
  lastPublishedAt: number
}

const subscribers = new Set<CombatVisualSubscriberEntry>()
const activeTimelines = new Set<object>()
let frameHandle: number | null = null
let visibilityBound = false

const requestFrame = (callback: FrameRequestCallback) => {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') return window.requestAnimationFrame(callback)
  return typeof window !== 'undefined' ? window.setTimeout(() => callback(performance.now()), 16) : null
}

const cancelFrame = (handle: number | null) => {
  if (handle === null || typeof window === 'undefined') return
  if (typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(handle)
  else window.clearTimeout(handle)
}

const onVisibilityChange = () => {
  if (typeof document === 'undefined') return
  if (document.hidden) {
    cancelFrame(frameHandle)
    frameHandle = null
    return
  }
  scheduleFrame()
}

const frame = (timestamp: number) => {
  frameHandle = null
  if (typeof document !== 'undefined' && document.hidden) return
  subscribers.forEach((subscriber) => {
    if (timestamp - subscriber.lastPublishedAt < subscriber.minIntervalMs) return
    subscriber.lastPublishedAt = timestamp
    subscriber.callback(timestamp)
  })
  scheduleFrame()
}

function scheduleFrame() {
  if (frameHandle !== null || subscribers.size === 0) return
  frameHandle = requestFrame(frame)
}

function bindVisibility() {
  if (visibilityBound || typeof document === 'undefined') return
  document.addEventListener('visibilitychange', onVisibilityChange)
  visibilityBound = true
}

function unbindVisibility() {
  if (!visibilityBound || typeof document === 'undefined') return
  document.removeEventListener('visibilitychange', onVisibilityChange)
  visibilityBound = false
}

/**
 * Presentation-only clock shared by all Combat timelines. It never writes to
 * GameStore and never schedules React state updates.
 */
export const subscribeCombatVisualFrame = (subscriber: CombatVisualFrameSubscriber, options: { minIntervalMs?: number } = {}) => {
  const entry: CombatVisualSubscriberEntry = {
    callback: subscriber,
    minIntervalMs: Math.max(0, options.minIntervalMs ?? 0),
    lastPublishedAt: -Infinity,
  }
  subscribers.add(entry)
  bindVisibility()
  scheduleFrame()
  return () => {
    subscribers.delete(entry)
    if (subscribers.size === 0) {
      cancelFrame(frameHandle)
      frameHandle = null
      unbindVisibility()
    }
  }
}

export const getCombatVisualSubscriberCount = () => subscribers.size

export const registerCombatVisualTimeline = (timeline: object) => {
  activeTimelines.add(timeline)
  return () => { activeTimelines.delete(timeline) }
}

export const getCombatVisualTimelineCount = () => activeTimelines.size
