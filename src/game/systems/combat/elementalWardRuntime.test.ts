import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { applyElementalWard, getElementalWardMultiplier } from './elementalWardRuntime'
import { calculateCombatDamage } from './effectResolver'

describe('elemental Wards', () => {
  it('reduces matching incoming damage and leaves other elements unchanged', () => {
    const state = createInitialState()
    state.combat.arcaneCoreRuntime.elapsedMs = 100
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', durationMs: 1000 })
    expect(getElementalWardMultiplier(state, 'fire')).toBeCloseTo(0.85)
    expect(getElementalWardMultiplier(state, 'water')).toBe(1)
    expect(getElementalWardMultiplier(state, 'fire', 1100)).toBe(1)
  })

  it('replaces a Ward from the same source and refreshes its duration', () => {
    const state = createInitialState()
    state.combat.arcaneCoreRuntime.elapsedMs = 1000
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', durationMs: 1000 })
    state.combat.arcaneCoreRuntime.elapsedMs = 1500
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', durationMs: 1000 })
    expect(state.combat.elementalDamageReductions).toHaveLength(1)
    expect(state.combat.elementalDamageReductions[0].expiresAt).toBe(2500)
    expect(getElementalWardMultiplier(state, 'fire')).toBeCloseTo(0.85)
  })

  it('applies reduction multiplicatively alongside existing mitigation', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.enemyId = 'fire-elemental'
    state.combat.enemyHp = state.combat.enemyMaxHp = 1000
    const source = { actor: 'enemy' as const, kind: 'action' as const, sourceId: 'fire-hit', sourceMonsterId: 'fire-elemental' as const, tags: ['direct' as const] }
    const withoutWard = calculateCombatDamage(state, 100, 'fire', source, 'player', ['direct'])
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward' })
    const withWard = calculateCombatDamage(state, 100, 'fire', source, 'player', ['direct'])
    expect(withWard.wardMultiplier).toBe(0.85)
    expect(withWard.afterWard).toBeCloseTo(withoutWard.afterDefense * 0.85)
  })
})
