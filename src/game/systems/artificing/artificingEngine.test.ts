import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { advanceArtificing, cancelArtificingCraft, craftArtificingRecipe } from './artificingEngine'
import { migrateSave } from '../../../persistence/migrations'

describe('Artificing', () => {
  it('refunds a saved in-progress craft once and prevents later output', () => {
    let state = createInitialState()
    state.progress.lifetimeKillsByMonster['forest-wisp'] = 1
    state.inventory = { 'fire-fragment': 40, 'wisp-essence': 10, 'thorn-fiber': 10, 'grove-bark': 5, 'life-essence': 24 }
    const before = { ...state.inventory }
    craftArtificingRecipe(state, 'ember-staff')
    advanceArtificing(state, 2100)
    state = migrateSave(JSON.parse(JSON.stringify(state)))
    expect(cancelArtificingCraft(state)).toBe(true)
    expect(state.inventory).toEqual(before)
    expect(state.activities.artificing.activeJob).toBeNull()
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
    state.inventory['fire-fragment'] = 20
    state.inventory['wisp-essence'] = 10
    state.inventory['thorn-fiber'] = 10
    state.inventory['grove-bark'] = 5
    state.inventory['life-essence'] = 24
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(true)
    expect(state.inventory['ember-staff']).toBeUndefined()
    expect(state.inventory['fire-fragment']).toBe(0)
    expect(state.activities.artificing.activeJob).toEqual({ kind: 'artifact-forge', artifactId: 'ember-staff' })
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(false)
    advanceArtificing(state, 4999)
    expect(state.inventory['ember-staff']).toBeUndefined()
    const completions: unknown[] = []
    advanceArtificing(state, 1, (completion) => completions.push(completion))
    expect(state.inventory['ember-staff']).toBe(1)
    expect(state.activities.artificing.activeJob).toBeNull()
    advanceArtificing(state, 5000)
    expect(state.inventory['ember-staff']).toBe(1)
    expect(completions).toEqual([{ kind: 'artifact-forge', recipeId: 'ember-staff', artifactId: 'ember-staff', itemId: 'ember-staff' }])
  })

  it('identifies the originating recipe in normal Equipment completion payloads', () => {
    const state = createInitialState()
    state.progress.lifetimeKillsByMonster['forest-wisp'] = 1
    state.inventory['air-fragment'] = 40
    state.inventory['wisp-essence'] = 8
    state.inventory['thorn-fiber'] = 12
    state.inventory['grove-bark'] = 9
    const completions: unknown[] = []

    expect(craftArtificingRecipe(state, 'windthread-charm').ok).toBe(true)
    advanceArtificing(state, 5_000, (completion) => completions.push(completion))

    expect(completions).toEqual([{ kind: 'recipe', recipeId: 'windthread-charm', itemId: 'windthread-charm', quantity: 1 }])
  })

  it('does not partially consume on failure or bypass unlocks', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 20
    state.inventory['wisp-essence'] = 20
    state.inventory['thorn-fiber'] = 10
    state.inventory['life-essence'] = 100
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(false)
    expect(state.inventory['fire-fragment']).toBe(20)
    state.progress.lifetimeKillsByMonster['forest-wisp'] = 1
    state.protectedItems['fire-fragment'] = true
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(false)
    expect(state.inventory['wisp-essence']).toBe(20)
  })
})
