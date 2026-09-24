import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getEffectiveEquipmentItemStats, getEquipmentStats } from './equipmentStats'

describe('effective Equipment stats', () => {
  it('resolves Ember Staff core stats from its Artifact level', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'

    expect(getEffectiveEquipmentItemStats(state, 'ember-staff')).toEqual({ basicDamage: 5, spellPower: 16 })

    state.artifactProgress['ember-staff'] = { minorRanks: {} }
    expect(getEffectiveEquipmentItemStats(state, 'ember-staff')).toEqual({ basicDamage: 17, spellPower: 75 })
    expect(getEquipmentStats(state)).toMatchObject({ basicDamage: 17, spellPower: 75 })
  })

  it('includes Arcane Core modifiers in the shared equipment stat model', () => {
    const state = createInitialState()
state.arcaneCore.nodes['focus-r1-focus-capacity'] = { rank: 1 }

    expect(getEquipmentStats(state)).toMatchObject({ maxFocus: 1 })
  })
})
