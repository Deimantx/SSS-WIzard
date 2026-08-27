import { describe, expect, it } from 'vitest'
import { createInitialState } from '../store/initialState'
import { migrateSave } from './migrations'
import { serializeGameState } from './profileSaveManager'

describe('item discovery save migration', () => {
  it('seeds V10 archives from owned, equipped, and guaranteed defeated drops', () => {
    const legacy = createInitialState() as any
    legacy.saveVersion = 10
    delete legacy.progress.discoveredItems
    legacy.inventory = { 'apprentice-wand': 1, 'fire-fragment': 2 }
    legacy.equipment = { ...legacy.equipment, weapon: 'apprentice-wand' }
    legacy.progress.bossKillsByBoss = { 'grove-sentinel': 1 }

    const migrated = migrateSave(legacy)
    expect(migrated.saveVersion).toBe(11)
    expect(migrated.progress.discoveredItems).toEqual(expect.arrayContaining(['apprentice-wand', 'fire-fragment', 'grove-bark', 'wisp-essence', 'life-essence']))
    expect(migrated.progress.discoveredItems).not.toContain('heartseed')
  })

  it('round-trips the historical archive without deriving extra current-V11 entries', () => {
    const state = createInitialState()
    state.progress.discoveredItems = ['apprentice-wand', 'fire-fragment']
    state.inventory['water-fragment'] = 7
    const migrated = migrateSave(JSON.parse(JSON.stringify(serializeGameState(state))))
    expect(migrated.progress.discoveredItems).toEqual(['apprentice-wand', 'fire-fragment'])
    expect(migrated.inventory['water-fragment']).toBe(7)
  })
})
