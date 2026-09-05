import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { craftArtificingRecipe } from './artificingEngine'

describe('Artificing', () => {
  it('crafts exactly one equipment item and one recipe cost', () => {
    const state = createInitialState()
    state.progress.lifetimeKillsByMonster['forest-wisp'] = 1
    state.inventory['fire-fragment'] = 48
    state.inventory['wisp-essence'] = 24
    state.inventory['grove-bark'] = 3
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(true)
    expect(state.inventory['ember-staff']).toBe(1)
    expect(state.inventory['fire-fragment']).toBe(0)
    expect(craftArtificingRecipe(state, 'ember-staff').ok).toBe(false)
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
