export type CombatVisualFrameSubscriber = (timestamp: number) => void

const subscribers = new Set<CombatVisualFrameSubscriber>()
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
  subscribers.forEach((subscriber) => subscriber(timestamp))
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
export const subscribeCombatVisualFrame = (subscriber: CombatVisualFrameSubscriber) => {
  subscribers.add(subscriber)
  bindVisibility()
  scheduleFrame()
  return () => {
    subscribers.delete(subscriber)
    if (subscribers.size === 0) {
      cancelFrame(frameHandle)
      frameHandle = null
      unbindVisibility()
    }
  }
}

export const getCombatVisualSubscriberCount = () => subscribers.size

