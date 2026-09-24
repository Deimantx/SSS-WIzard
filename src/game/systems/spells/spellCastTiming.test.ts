import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getEffectiveSpellCastTimeMs } from './spellCastTiming'

describe('Artifact school-specific cast time', () => {
  it('does not change Fire Spell cast time for Cinder Focus', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    state.artifactProgress['ember-staff'] = { minorRanks: { quickkindle: 10 } }
    expect(getEffectiveSpellCastTimeMs(state, 'fire-bolt')).toBe(1000)
    expect(getEffectiveSpellCastTimeMs(state, 'water-bolt')).toBe(1000)
  })
})
