import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES } from '../../content/arcaneCore/arcaneCoreBranches'
import { createInitialState } from '../../../store/initialState'
import { executeCombatEffects } from '../combat/effectResolver'
import { getArcaneCoreV6CastModifiers } from './arcaneCoreV6Runtime'

const node = (branch: 'power' | 'vitality' | 'focus' | 'control', name: string) => ARCANE_CORE_BRANCHES.find((entry) => entry.id === branch)!.nodes.find((candidate) => candidate.name === name)!
const castContext = (overrides: Partial<Parameters<typeof getArcaneCoreV6CastModifiers>[1]> = {}): Parameters<typeof getArcaneCoreV6CastModifiers>[1] => ({ origin: 'auto', spellId: 'fire-bolt', loadoutSlotIndex: 0, damaging: true, manaCost: 10, maxMana: 100, playerMana: 100, enemyHealthPercent: 100, ...overrides })

describe('Arcane Core V6 runtime primitives', () => {
  it('applies authored cycle and cost-band mechanics through shared cast modifiers', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('power', 'Arcane Spark').id] = { rank: 5 }
    state.arcaneCore.nodes[node('power', 'Overcharge').id] = { rank: 5 }
    state.combat.arcaneCoreRuntime.damagingSpellCount = 3
    const modifiers = getArcaneCoreV6CastModifiers(state, castContext(), true)
    expect(modifiers.damageMultiplier).toBeCloseTo(1.2)
  })

  it('distinguishes queued/manual alternation from AUTO and honors exact slot identity', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('focus', 'Convergence').id] = { rank: 1 }
    state.arcaneCore.nodes[node('focus', 'Prepared Slot').id] = { rank: 5 }
    state.combat.arcaneCoreRuntime.lastCastOrigin = 'manual-direct'
    state.combat.arcaneCoreRuntime.alternatingCastStreak = 3
    state.combat.arcaneCoreRuntime.castLoadoutSlots = [1]
    const modifiers = getArcaneCoreV6CastModifiers(state, castContext({ origin: 'auto', loadoutSlotIndex: 0 }), true)
    expect(modifiers.free).toBe(true)
    expect(modifiers.actionSpeedMultiplier).toBeGreaterThan(1)
    expect(modifiers.manaCostMultiplier).toBeLessThan(1)
  })

  it('routes V6 barrier reactions through combat events without a player block mechanic', () => {
    const state = createInitialState()
    state.combat.active = true
    state.arcaneCore.nodes[node('vitality', 'Reactive Ward').id] = { rank: 5 }
    executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 10 } }] }], { actor: 'enemy', kind: 'action', sourceId: 'test-action', tags: ['special'] })
    expect(state.combat.playerBarrier).toBeGreaterThan(0)
  })
})
