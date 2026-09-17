import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { recalculateDerivedStats } from '../../engine'
import { getEquipmentStats } from '../../core/equipment/equipmentStats'
import { getArcaneCoreCombatModifierProviders, getArcaneCoreCombatRules, getArcaneCoreSpecialEffects } from './arcaneCoreProgression'

describe('Arcane Core V3 integration', () => {
  it('resolves ranked providers once at the current rank', () => {
    const state = createInitialState()
    state.arcaneCore.totalXp = 1000
    state.arcaneCore.nodes['power-r1-arcane-force'] = { rank: 3 }
    state.arcaneCore.nodes['focus-r2-focused-power'] = { rank: 2 }
    recalculateDerivedStats(state)
    expect(getEquipmentStats(state).spellPower).toBe(6)
    expect(getArcaneCoreCombatModifierProviders(state.arcaneCore).some(({ node }) => node.id === 'power-r1-arcane-force')).toBe(false)
  })
  it('keeps special and rule providers rank-aware', () => {
    const state = createInitialState()
    state.arcaneCore.nodes['power-r3-arcane-momentum'] = { rank: 4 }
    state.arcaneCore.nodes['focus-r3-mana-overflow'] = { rank: 1 }
    expect(getArcaneCoreSpecialEffects(state.arcaneCore)).toEqual(expect.arrayContaining([{ type: 'nth-damaging-spell-bonus', every: 4, damageMultiplier: 1.125 }, { type: 'mana-overflow-to-barrier', conversion: 0.25, maxHealthPercentPerSecondCap: 0.05 }]))
    expect(getArcaneCoreCombatRules(state.arcaneCore)).toHaveLength(0)
  })
})
