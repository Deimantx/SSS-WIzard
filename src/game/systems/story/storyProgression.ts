import { STORY_EVENTS, STORY_EVENT_ORDER, type StoryEventDefinition } from '../../content/story/storyEvents'
import { recoverPortalShard } from '../dark-portal/portalShardProgression'
import type { GameState, ScreenId, StoryEventId, StoryProgressState } from '../../types'

const storyEventIds = new Set<StoryEventId>(STORY_EVENT_ORDER)

const normalizeEventIds = (value: unknown) => {
  if (!Array.isArray(value)) return [] as StoryEventId[]
  const present = new Set(value.filter((id): id is StoryEventId => typeof id === 'string' && storyEventIds.has(id as StoryEventId)))
  return STORY_EVENT_ORDER.filter((id) => present.has(id))
}

export const normalizeStoryProgress = (state: GameState) => {
  const current = state.storyProgress as Partial<StoryProgressState> | undefined
  const completedEventIds = normalizeEventIds(current?.completedEventIds)
  const completed = new Set(completedEventIds)
  const pendingEventIds = normalizeEventIds(current?.pendingEventIds).filter((id) => !completed.has(id))
  state.storyProgress = { pendingEventIds, completedEventIds }
  return state.storyProgress
}

export const isStoryEventTriggerSatisfied = (state: Pick<GameState, 'progress'>, definition: StoryEventDefinition) => {
  if (definition.trigger.type !== 'boss-kill') return false
  return (state.progress.bossKillsByBoss[definition.trigger.bossId] ?? 0) >= definition.trigger.requiredKills
}

export const isStoryEventTriggered = (state: Pick<GameState, 'storyProgress'>, eventId: StoryEventId) => state.storyProgress.pendingEventIds.includes(eventId) || state.storyProgress.completedEventIds.includes(eventId)
export const isStoryEventCompleted = (state: Pick<GameState, 'storyProgress'>, eventId: StoryEventId) => state.storyProgress.completedEventIds.includes(eventId)
export const isScreenUnlocked = (state: Pick<GameState, 'storyProgress'>, screenId: ScreenId) => {
  const unlockEvents = STORY_EVENT_ORDER.map((eventId) => STORY_EVENTS[eventId]).filter((event) => event.unlocks?.screens?.includes(screenId))
  return unlockEvents.length === 0 || unlockEvents.some((event) => isStoryEventTriggered(state, event.id))
}

export const getActiveStoryEvent = (state: Pick<GameState, 'storyProgress'>) => {
  const eventId = state.storyProgress.pendingEventIds[0]
  return eventId ? STORY_EVENTS[eventId] : null
}

const ensureStoryRewards = (state: GameState, definition: StoryEventDefinition) => {
  definition.rewards.forEach((reward) => {
    if (reward.type === 'portal-shard') recoverPortalShard(state, reward.shardId)
  })
}

/** Reconciles all authored story events after an authoritative progression change or save load. */
export const reconcileStoryProgression = (state: GameState) => {
  normalizeStoryProgress(state)
  for (const eventId of STORY_EVENT_ORDER) {
    const definition = STORY_EVENTS[eventId]
    if (!isStoryEventTriggerSatisfied(state, definition)) continue
    ensureStoryRewards(state, definition)
    if (state.storyProgress.completedEventIds.includes(eventId) || state.storyProgress.pendingEventIds.includes(eventId)) continue
    state.storyProgress.pendingEventIds.push(eventId)
  }
  return state.storyProgress
}

/** Acknowledges one pending event and returns its authored continuation destination. */
export const completeStoryEvent = (state: GameState, eventId: StoryEventId): ScreenId | null => {
  normalizeStoryProgress(state)
  const definition = STORY_EVENTS[eventId]
  const pendingIndex = state.storyProgress.pendingEventIds.indexOf(eventId)
  if (!definition || pendingIndex < 0) return null
  ensureStoryRewards(state, definition)
  state.storyProgress.pendingEventIds.splice(pendingIndex, 1)
  if (!state.storyProgress.completedEventIds.includes(eventId)) state.storyProgress.completedEventIds.push(eventId)
  normalizeStoryProgress(state)
  return definition.continueTo ?? null
}
