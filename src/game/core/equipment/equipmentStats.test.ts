import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { playerBasicDamage } from '../../engine'
import { getEffectiveEquipmentItemStats, getEquipmentStats } from './equipmentStats'

describe('effective Equipment stats', () => {
  it('resolves Ember Staff core stats from its Artifact level', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'

    expect(getEffectiveEquipmentItemStats(state, 'ember-staff')).toEqual({ basicDamage: 5, spellPower: 16 })

    state.artifactProgress['ember-staff'] = { level: 10, allocatedNodeIds: [], attunedNodeIds: [] }
    expect(getEffectiveEquipmentItemStats(state, 'ember-staff')).toEqual({ basicDamage: 17, spellPower: 75 })
    expect(getEquipmentStats(state)).toMatchObject({ basicDamage: 17, spellPower: 75 })
  })

  it('includes current Artifact level in weapon Basic Damage', () => {
    const state = createInitialState()
    state.equipment.weapon = 'stoneheart-scepter'
    state.artifactProgress['stoneheart-scepter'] = { level: 10, allocatedNodeIds: [], attunedNodeIds: [] }

    expect(playerBasicDamage(state)).toBe(19 + 5)
  })

  it('keeps normal Equipment on its authored static stats', () => {
    const state = createInitialState()

    expect(getEffectiveEquipmentItemStats(state, 'wispbound-ring')).toEqual({ maxMana: 10, manaRegen: 1, spellPower: 5 })
  })
})
