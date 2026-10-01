import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getEffectiveEquipmentItemStats, getEquippedItemStats, getPlayerBuildStaticStats, getPlayerBuildStaticStatSources } from './equipmentStats'
import { generateSigil } from '../../systems/sigils/sigilGeneration'
import { ITEMS } from '../../content/items/items'
import type { ItemDefinition } from '../../types'

describe('effective Equipment stats', () => {
  it('resolves Ember Staff core stats from its Artifact level', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'

    expect(getEffectiveEquipmentItemStats(state, 'ember-staff')).toEqual({ spellPower: 15 })

    state.artifactProgress['ember-staff'] = { minorRanks: {} }
    expect(getEffectiveEquipmentItemStats(state, 'ember-staff')).toEqual({ spellPower: 15 })
    expect(getEquippedItemStats(state)).toMatchObject({ spellPower: 15 })
  })

  it('includes Mana Core modifiers in the shared equipment stat model', () => {
    const state = createInitialState()
    state.arcaneCore.nodes['mana-r1-mana-reservoir'] = { rank: 1 }

    expect(getPlayerBuildStaticStats(state)).toMatchObject({ maxManaPct: 0.005 })
  })

  it('keeps every static provider isolated and sums each exactly once', () => {
    const state = createInitialState()
    const equipmentId = 'static-provider-fixture' as keyof typeof ITEMS
    ITEMS[equipmentId] = { id: equipmentId, name: 'Static Fixture', description: '', icon: '*', color: '#fff', kind: 'equipment', category: 'equipment', inventoryCategory: 'equipment', source: 'Test', sellValue: 0, canDestroy: true, equipmentSlot: 'armor', stats: { defense: 11 } } satisfies ItemDefinition
    try {
      state.equipment.armor = equipmentId
      state.equipment.weapon = 'ember-staff'
      state.arcaneCore.nodes['mana-r1-mana-reservoir'] = { rank: 1 }
      state.crystals.equippedSlots[0] = 'cataclysm-t1'
      const sigil = generateSigil({ state, locationId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, forcedQuality: 'common', forcedMainStatId: 'spellPower', rng: () => 0, source: 'debug' })
      state.sigils.equipped[1] = sigil.instanceId

      const sources = getPlayerBuildStaticStatSources(state)
      expect(sources.equipment).toEqual({ defense: 11 })
      expect(sources.artifact).toEqual({ spellPower: 15 })
      expect(sources.arcaneCore).toEqual({ maxManaPct: 0.005 })
      expect(sources.crystal).toEqual({ spellPower: 7, critDamage: 0.04 })
      expect(sources.sigil).toEqual({ spellPower: 5 })
      expect(sources.sigilSet).toEqual({ spellPowerPct: 0 })

      const expected = Object.values(sources).reduce((sum, source) => {
        Object.entries(source).forEach(([key, value]) => { if (typeof value === 'number') sum[key] = (sum[key] ?? 0) + value })
        return sum
      }, {} as Record<string, number>)
      expect(getPlayerBuildStaticStats(state)).toEqual(expected)
      expect(getPlayerBuildStaticStats(state)).toMatchObject({ defense: 11, spellPower: 27, maxManaPct: 0.005, critDamage: 0.04 })
    } finally {
      delete ITEMS[equipmentId]
    }
  })
})
