import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { advanceArtificing, cancelArtificingCraft, craftArtificingRecipe } from './artificingEngine'
import { migrateSave } from '../../../persistence/migrations'

describe('Artificing', () => {
  it('crafts Corrupted Howlstaff from normal Howling Den loot before defeating Greatbear', () => {
    const state = createInitialState()
    state.inventory = { 'predator-fang': 20, 'corrupted-beast-essence': 20, 'air-fragment': 44, 'prismatic-fragment': 8 }
    const before = { ...state.inventory }
    expect(craftArtificingRecipe(state, 'corrupted-howlstaff').ok).toBe(false)
    expect(state.inventory).toEqual(before)

    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.lifetimeKillsByMonster['cavefang-wolf'] = 1
    expect(state.progress.bossKillsByBoss['corrupted-greatbear'] ?? 0).toBe(0)
    expect(craftArtificingRecipe(state, 'corrupted-howlstaff').ok).toBe(true)
    expect(state.inventory['greatbear-core']).toBeUndefined()
    expect(state.inventory['predator-fang']).toBe(0)
    advanceArtificing(state, 5000)
    expect(state.inventory['corrupted-howlstaff']).toBe(1)
    expect(state.progress.discoveredItems).toContain('corrupted-howlstaff')
  })

  it('refunds a saved in-progress craft once and prevents later output', () => {
    let state = createInitialState()
    state.progress.lifetimeKillsByMonster['forest-wisp'] = 1
    state.inventory = { 'fire-fragment': 96, 'wisp-essence': 48, 'grove-bark': 6 }
    const before = { ...state.inventory }
    craftArtificingRecipe(state, 'ember-staff')
    advanceArtificing(state, 2100)
    state = migrateSave(JSON.parse(JSON.stringify(state)))
    expect(cancelArtificingCraft(state)).toBe(true)
    expect(state.inventory).toEqual(before)
    expect(state.activities.artificing).toEqual({ activeRecipeId: null, progressMs: 0 })
    expect(cancelArtificingCraft(state)).toBe(false)
    advanceArtificing(state, 10000)
    expect(state.inventory).toEqual(before)
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(true)
    advanceArtificing(state, 5000)
    const completedInventory = { ...state.inventory }
    expect(cancelArtificingCraft(state)).toBe(false)
    expect(state.inventory).toEqual(completedInventory)
    expect(state.inventory['ember-staff']).toBe(1)
  })
  it('starts once, consumes once, and completes exactly one output after five seconds', () => {
    const state = createInitialState()
    state.progress.lifetimeKillsByMonster['forest-wisp'] = 1
    state.inventory['fire-fragment'] = 48
    state.inventory['wisp-essence'] = 24
    state.inventory['grove-bark'] = 3
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(true)
    expect(state.inventory['ember-staff']).toBeUndefined()
    expect(state.inventory['fire-fragment']).toBe(0)
    expect(state.activities.artificing).toEqual({ activeRecipeId: 'ember-staff', progressMs: 0 })
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(false)
    advanceArtificing(state, 4999)
    expect(state.inventory['ember-staff']).toBeUndefined()
    advanceArtificing(state, 1)
    expect(state.inventory['ember-staff']).toBe(1)
    expect(state.activities.artificing).toEqual({ activeRecipeId: null, progressMs: 0 })
    advanceArtificing(state, 5000)
    expect(state.inventory['ember-staff']).toBe(1)
  })

  it('does not partially consume on failure or bypass unlocks', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 48
    state.inventory['wisp-essence'] = 24
    state.inventory['grove-bark'] = 3
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(false)
    expect(state.inventory['fire-fragment']).toBe(48)
    state.progress.lifetimeKillsByMonster['forest-wisp'] = 1
    state.protectedItems['fire-fragment'] = true
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(false)
    expect(state.inventory['wisp-essence']).toBe(24)
  })
})
