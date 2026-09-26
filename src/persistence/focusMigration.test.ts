import { describe, expect, it } from 'vitest'
import { createInitialState, SAVE_VERSION } from '../store/initialState'
import { serializeGameState } from './profileSaveManager'
import { migrateSave } from './migrations'

describe('Mana and Prismatic save migration', () => {
  it('normalizes a V9 save without losing gameplay data', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 9, inventory: { ...initial.inventory, 'fire-fragment': 37 } })

    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.inventory['fire-fragment']).toBe(37)
  })

  it('round-trips Prismatic inventory and an active job', () => {
    const state = createInitialState()
    state.inventory['prismatic-fragment'] = 77
    state.activities.transmutation.jobs['prismatic-fragment'] = { echoesAssigned: 2, progressMs: 4_321 }

    const loaded = migrateSave(JSON.parse(JSON.stringify(serializeGameState(state))))
    expect(loaded.inventory['prismatic-fragment']).toBe(77)
    expect(loaded.activities.transmutation.jobs['prismatic-fragment']).toEqual({ acolyteAssigned: true, echoesAssigned: 2, progressMs: 4_321 })
  })

  it('migrates a V16 save without presets to a safe empty combat preset', () => {
    const state = createInitialState() as any
    delete state.spellPresets
    state.saveVersion = 16
    const migrated = migrateSave(state)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.spellPresets).toEqual({ presets: [{ id: 'spell-preset-1', name: 'Combat Loadout', slots: [] }], selectedPresetId: 'spell-preset-1' })
  })
})
