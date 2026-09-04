import type { LootRevealEvent, CombatLootRevealInput, LootRevealItem } from './lootRevealTypes'

export const MAX_VISIBLE_LOOT_REVEALS = 3
export const MAX_QUEUED_LOOT_REVEALS = 10
export const LOOT_MERGE_WINDOW_MS = 1000

let events: LootRevealEvent[] = []
let serial = 0
const listeners = new Set<() => void>()
const timers = new Map<string, ReturnType<typeof setTimeout>>()
const expiryTimes = new Map<string, number>()
const pausedRemaining = new Map<string, number>()

const emit = () => listeners.forEach((listener) => listener())
const sourceKeyFor = (input: Pick<CombatLootRevealInput, 'sourceLabel' | 'sourceDetail'>) => `${input.sourceLabel}\u0000${input.sourceDetail}`
const normalizeItems = (items: readonly LootRevealItem[]) => {
  const merged = new Map<string, LootRevealItem>()
  items.forEach((item) => {
    if (!item || item.quantity <= 0) return
    const previous = merged.get(item.itemId)
    merged.set(item.itemId, previous ? { ...previous, quantity: previous.quantity + item.quantity, isNewDiscovery: previous.isNewDiscovery || item.isNewDiscovery } : { ...item })
  })
  return [...merged.values()]
}
const durationFor = (items: readonly LootRevealItem[]) => items.some((item) => item.isNewDiscovery) ? 3600 : 2700
const clearTimer = (id: string) => {
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
}
const schedule = (event: LootRevealEvent, delay = event.durationMs) => {
  clearTimer(event.id)
  const safeDelay = Math.max(0, delay)
  expiryTimes.set(event.id, Date.now() + safeDelay)
  timers.set(event.id, setTimeout(() => removeLootReveal(event.id), safeDelay))
}
const scheduleVisible = () => events.slice(0, MAX_VISIBLE_LOOT_REVEALS).forEach((event) => {
  if (!timers.has(event.id) && !pausedRemaining.has(event.id)) schedule(event)
})

export const subscribeLootReveals = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }
export const getLootReveals = () => events
export const getVisibleLootReveals = () => events.slice(0, MAX_VISIBLE_LOOT_REVEALS)

export const enqueueCombatLootReveal = (input: CombatLootRevealInput) => {
  const now = input.now ?? Date.now()
  const items = normalizeItems(input.items)
  if (!items.length) return null
  const sourceKey = sourceKeyFor(input)
  const mergeIndex = events.findIndex((event) => {
    const age = now - event.createdAt
    return event.sourceKey === sourceKey && age >= 0 && age <= LOOT_MERGE_WINDOW_MS
  })
  if (mergeIndex >= 0) {
    const existing = events[mergeIndex]
    if (!existing) return null
    const mergedItems = normalizeItems([...existing.items, ...items])
    const updated = { ...existing, items: mergedItems, durationMs: durationFor(mergedItems) }
    events = events.map((event, index) => index === mergeIndex ? updated : event)
    if (!pausedRemaining.has(existing.id)) schedule(updated, Math.max(0, updated.durationMs - Math.max(0, now - existing.createdAt)))
    emit()
    return existing.id
  }
  const event: LootRevealEvent = { id: `loot-reveal-${++serial}`, sourceKind: 'combat', sourceKey, sourceLabel: input.sourceLabel, sourceDetail: input.sourceDetail, items, createdAt: now, durationMs: durationFor(items) }
  const bounded = [...events, event]
  const firstRetainedIndex = Math.max(0, bounded.length - (MAX_VISIBLE_LOOT_REVEALS + MAX_QUEUED_LOOT_REVEALS))
  bounded.slice(0, firstRetainedIndex).forEach((dropped) => {
    clearTimer(dropped.id)
    expiryTimes.delete(dropped.id)
    pausedRemaining.delete(dropped.id)
  })
  events = bounded.slice(firstRetainedIndex)
  scheduleVisible()
  emit()
  return event.id
}

export const pauseLootReveal = (id: string) => {
  if (!events.some((event) => event.id === id) || pausedRemaining.has(id)) return
  const expiry = expiryTimes.get(id)
  if (expiry === undefined) return
  clearTimer(id)
  pausedRemaining.set(id, Math.max(0, expiry - Date.now()))
}

export const resumeLootReveal = (id: string) => {
  const remaining = pausedRemaining.get(id)
  if (remaining === undefined) return
  pausedRemaining.delete(id)
  const event = events.find((candidate) => candidate.id === id)
  if (event) schedule(event, remaining)
}

export const removeLootReveal = (id: string) => {
  clearTimer(id)
  expiryTimes.delete(id)
  pausedRemaining.delete(id)
  const next = events.filter((event) => event.id !== id)
  if (next.length === events.length) return
  events = next
  scheduleVisible()
  emit()
}

export const clearLootReveals = () => {
  timers.forEach((timer) => clearTimeout(timer))
  timers.clear()
  expiryTimes.clear()
  pausedRemaining.clear()
  events = []
  emit()
}
