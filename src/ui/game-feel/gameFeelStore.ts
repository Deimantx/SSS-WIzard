import type { GameFeelEvent, GameFeelEventInput } from './gameFeelTypes'

export const MAX_ACTIVE_GAME_FEEL_EVENTS = 10

let events: GameFeelEvent[] = []
let serial = 0
const listeners = new Set<() => void>()
const removalTimers = new Map<string, ReturnType<typeof setTimeout>>()

const emit = () => listeners.forEach((listener) => listener())

export const subscribeGameFeelEvents = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getGameFeelEvents = () => events

export const emitGameFeelEvent = (input: GameFeelEventInput) => {
  const event: GameFeelEvent = { ...input, id: `game-feel-${++serial}`, createdAt: Date.now() }
  if (events.length >= MAX_ACTIVE_GAME_FEEL_EVENTS) {
    const oldest = events[0]
    if (oldest) removeGameFeelEvent(oldest.id)
  }
  events = [...events, event]
  emit()
  const timer = setTimeout(() => removeGameFeelEvent(event.id), input.type === 'unlock' ? 760 : 680)
  removalTimers.set(event.id, timer)
  return event.id
}

export const removeGameFeelEvent = (id: string) => {
  const timer = removalTimers.get(id)
  if (timer) clearTimeout(timer)
  removalTimers.delete(id)
  const next = events.filter((event) => event.id !== id)
  if (next.length === events.length) return
  events = next
  emit()
}

export const clearGameFeelEvents = () => {
  removalTimers.forEach((timer) => clearTimeout(timer))
  removalTimers.clear()
  events = []
  emit()
}

