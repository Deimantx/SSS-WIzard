import { describe, expect, it } from 'vitest'
import { createInitialState } from '../store/initialState'
import { serializeGameState } from './profileSaveManager'
import { migrateSave } from './migrations'

describe('Focus and Prismatic save migration', () => {
  it('adds a safe Rank I default to a V9 save without losing gameplay data', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 9, progress: { ...initial.progress, focusImprovement: undefined }, inventory: { ...initial.inventory, 'fire-fragment': 37 } })

    expect(migrated.saveVersion).toBe(11)
    expect(migrated.progress.focusImprovement).toEqual({ rank: 1, level: 0 })
    expect(migrated.inventory['fire-fragment']).toBe(37)
  })

  it('round-trips Prismatic inventory, Focus level, and an active job', () => {
    const state = createInitialState()
    state.inventory['prismatic-fragment'] = 77
    state.progress.focusImprovement.level = 4
    state.activities.transmutation.jobs['prismatic-fragment'] = { echoesAssigned: 2, progressMs: 4_321 }

    const loaded = migrateSave(JSON.parse(JSON.stringify(serializeGameState(state))))
    expect(loaded.inventory['prismatic-fragment']).toBe(77)
    expect(loaded.progress.focusImprovement).toEqual({ rank: 1, level: 4 })
    expect(loaded.activities.transmutation.jobs['prismatic-fragment']).toEqual({ echoesAssigned: 2, progressMs: 4_321 })
    expect(loaded.player.maxFocus).toBe(120)
  })
})
