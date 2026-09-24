import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getEffectiveSpellCastTimeMs } from './spellCastTiming'

describe('Artifact school-specific cast time', () => {
  it('reduces only Fire Spell cast time for Quickkindle', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    state.artifactProgress['ember-staff'] = { minorRanks: { quickkindle: 10 } }
    expect(getEffectiveSpellCastTimeMs(state, 'fire-bolt')).toBe(963.75)
    expect(getEffectiveSpellCastTimeMs(state, 'water-bolt')).toBe(1000)
  })
})
