import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { completeStoryEvent, getActiveStoryEvent, isScreenUnlocked, reconcileStoryProgression } from './storyProgression'

describe('story progression', () => {
  it('queues the first Edrin discovery and grants exactly one shard idempotently', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1

    reconcileStoryProgression(state)
    reconcileStoryProgression(state)

    expect(state.storyProgress.pendingEventIds).toEqual(['edrin-dark-portal-discovery'])
    expect(state.storyProgress.completedEventIds).toEqual([])
    expect(state.inventory['black-portal-shard']).toBe(1)
    expect(state.progress.discoveredItems.filter((id) => id === 'black-portal-shard')).toHaveLength(1)
    expect(getActiveStoryEvent(state)?.id).toBe('edrin-dark-portal-discovery')
    expect(isScreenUnlocked(state, 'tower-dark-portal')).toBe(true)
  })

  it('does not requeue a completed event', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    reconcileStoryProgression(state)

    expect(completeStoryEvent(state, 'edrin-dark-portal-discovery')).toBe('tower-dark-portal')
    reconcileStoryProgression(state)

    expect(state.storyProgress.pendingEventIds).toEqual([])
    expect(state.storyProgress.completedEventIds).toEqual(['edrin-dark-portal-discovery'])
    expect(state.inventory['black-portal-shard']).toBe(1)
  })
})

