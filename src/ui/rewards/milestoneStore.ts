export type MilestoneKind = 'spell' | 'recipe' | 'monster' | 'school'

export interface MilestoneEvent {
  id: string
  kind: MilestoneKind
  eyebrow: string
  title: string
  detail?: string
  createdAt: number
}

export const MAX_VISIBLE_MILESTONES = 1
export const MAX_QUEUED_MILESTONES = 3

let events: MilestoneEvent[] = []
let serial = 0
const listeners = new Set<() => void>()
const timers = new Map<string, ReturnType<typeof setTimeout>>()

const emit = () => listeners.forEach((listener) => listener())
export const subscribeMilestones = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }
export const getMilestones = () => events
export const enqueueMilestone = (input: Omit<MilestoneEvent, 'id' | 'createdAt'> & { now?: number }) => {
  const event: MilestoneEvent = { id: `milestone-${++serial}`, kind: input.kind, eyebrow: input.eyebrow, title: input.title, detail: input.detail, createdAt: input.now ?? Date.now() }
  events = [...events, event].slice(-(MAX_VISIBLE_MILESTONES + MAX_QUEUED_MILESTONES))
  scheduleVisibleMilestone()
  emit()
  return event.id
}
const scheduleVisibleMilestone = () => {
  const event = events[0]
  if (!event || timers.has(event.id)) return
  timers.set(event.id, setTimeout(() => removeMilestone(event.id), 2700))
}
export const removeMilestone = (id: string) => {
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
  const next = events.filter((event) => event.id !== id)
  if (next.length === events.length) return
  events = next
  scheduleVisibleMilestone()
  emit()
}
export const clearMilestones = () => {
  timers.forEach((timer) => clearTimeout(timer))
  timers.clear()
  events = []
  emit()
}
