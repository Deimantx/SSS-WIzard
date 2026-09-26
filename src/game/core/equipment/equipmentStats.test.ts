import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getEffectiveEquipmentItemStats, getEquipmentStats } from './equipmentStats'

describe('effective Equipment stats', () => {
  it('resolves Ember Staff core stats from its Artifact level', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'

    expect(getEffectiveEquipmentItemStats(state, 'ember-staff')).toEqual({ spellPower: 15 })

    state.artifactProgress['ember-staff'] = { minorRanks: {} }
    expect(getEffectiveEquipmentItemStats(state, 'ember-staff')).toEqual({ spellPower: 15 })
    expect(getEquipmentStats(state)).toMatchObject({ spellPower: 15 })
  })

  it('includes Mana Core modifiers in the shared equipment stat model', () => {
    const state = createInitialState()
    state.arcaneCore.nodes['mana-r1-mana-reservoir'] = { rank: 1 }

    expect(getEquipmentStats(state)).toMatchObject({ maxManaPct: 0.005 })
  })
})
