import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { advanceArtificing, cancelArtificingCraft, craftArtificingRecipe } from './artificingEngine'
import { migrateSave } from '../../../persistence/migrations'

const provideForgeMaterials = (state: ReturnType<typeof createInitialState>, recipeId: 'ember-staff' | 'windthread-wand') => {
  state.inventory[recipeId === 'ember-staff' ? 'fire-fragment' : 'air-fragment'] = 40
  state.inventory['artifact-essence'] = 20
}

describe('Artificing', () => {
  it('refunds a saved in-progress Artifact forge once and prevents later output', () => {
    let state = createInitialState()
    provideForgeMaterials(state, 'ember-staff')
    const before = { ...state.inventory }
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(true)
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

  it('starts once, consumes once, and completes exactly one Artifact after five seconds', () => {
    const state = createInitialState()
    provideForgeMaterials(state, 'ember-staff')
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(true)
    expect(state.inventory['ember-staff']).toBeUndefined()
    expect(state.inventory['fire-fragment']).toBe(20)
    expect(state.inventory['artifact-essence']).toBe(0)
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

  it('does not partially consume on failure or bypass legal ingredient rules', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 20
    state.inventory['artifact-essence'] = 20
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(true)
    expect(state.inventory['fire-fragment']).toBe(0)
    expect(state.inventory['artifact-essence']).toBe(0)
    const protectedState = createInitialState()
    provideForgeMaterials(protectedState, 'ember-staff')
    protectedState.protectedItems['fire-fragment'] = true
    expect(craftArtificingRecipe(protectedState, 'ember-staff').ok).toBe(false)
    expect(protectedState.inventory['fire-fragment']).toBe(40)
    expect(protectedState.inventory['artifact-essence']).toBe(20)
  })

  it('rejects obsolete non-Artifact Artificing outputs', () => {
    const state = createInitialState()
    expect(craftArtificingRecipe(state, 'windthread-charm' as never).ok).toBe(false)
    expect(craftArtificingRecipe(state, 'windthread-charm' as never)).toMatchObject({ ok: false, reason: 'Only Artifact recipes can be forged.' })
  })
})
