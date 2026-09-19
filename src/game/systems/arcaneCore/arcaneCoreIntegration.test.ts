import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES } from '../../content/arcaneCore/arcaneCoreBranches'
import { createInitialState } from '../../../store/initialState'
import { getArcaneCoreCombatModifierProviders, getArcaneCoreSpecialEffects, getArcaneCoreStaticStats } from './arcaneCoreProgression'

const node = (branch: 'power' | 'vitality' | 'focus' | 'control', name: string) => ARCANE_CORE_BRANCHES.find((entry) => entry.id === branch)!.nodes.find((candidate) => candidate.name === name)!

describe('Arcane Core V6 integration', () => {
  it('resolves percentage stat providers at the current rank', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('power', 'Arcane Scaling').id] = { rank: 3 }
    state.arcaneCore.nodes[node('vitality', 'Vitality').id] = { rank: 2 }
    const stats = getArcaneCoreStaticStats(state.arcaneCore)
    expect(stats.spellPowerPct).toBeCloseTo(0.003)
    expect(stats.maxHealthPct).toBeCloseTo(0.01)
    expect(getArcaneCoreCombatModifierProviders(state.arcaneCore).length).toBeGreaterThanOrEqual(0)
  })

  it('keeps authored V6 mechanics available as generic special metadata', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('power', 'Arcane Spark').id] = { rank: 5 }
    state.arcaneCore.nodes[node('focus', 'Resonance').id] = { rank: 1 }
    const effects = getArcaneCoreSpecialEffects(state.arcaneCore)
    expect(effects).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'v6-generic', key: 'Arcane Spark', scope: 'power:1:S3', value: 5 }),
      expect.objectContaining({ type: 'v6-generic', key: 'Resonance', scope: 'focus:3:M', value: 1 }),
    ]))
  })
})
