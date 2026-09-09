import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { playerBasicDamage } from '../../engine'
import { getEffectiveEquipmentItemStats, getEquipmentStats } from './equipmentStats'

describe('effective Equipment stats', () => {
  it('resolves Prismatic Focus core stats from its Artifact level', () => {
    const state = createInitialState()
    state.equipment.weapon = 'prismatic-focus'

    expect(getEffectiveEquipmentItemStats(state, 'prismatic-focus')).toEqual({ basicDamage: 2, spellPower: 11, maxMana: 10, maxFocus: 2 })

    state.artifactProgress['prismatic-focus'] = { level: 10, allocatedNodeIds: [], attunedNodeIds: [] }
    expect(getEffectiveEquipmentItemStats(state, 'prismatic-focus')).toEqual({ basicDamage: 10, spellPower: 58, maxMana: 42, maxFocus: 20 })
    expect(getEquipmentStats(state)).toMatchObject({ basicDamage: 10, spellPower: 58, maxMana: 42, maxFocus: 20 })
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
