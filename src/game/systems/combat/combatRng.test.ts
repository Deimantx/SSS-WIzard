import { describe, expect, it } from 'vitest'
import { COMBAT_RNG_DEFAULT_SEED } from '../../core/balance/combatRng'
import { nextCombatRandom, normalizeCombatRngState } from './combatRng'
import { createInitialState } from '../../../store/initialState'
import { migrateSave } from '../../../persistence/migrations'

describe('persisted combat RNG', () => {
  it('is deterministic for the same uint32 state', () => {
    const left = { combatRngState: COMBAT_RNG_DEFAULT_SEED }
    const right = { combatRngState: COMBAT_RNG_DEFAULT_SEED }
    expect([nextCombatRandom(left), nextCombatRandom(left), nextCombatRandom(left)]).toEqual([nextCombatRandom(right), nextCombatRandom(right), nextCombatRandom(right)])
    expect(left.combatRngState).toBe(right.combatRngState)
  })

  it('normalizes invalid persisted values to the canonical seed', () => {
    expect(normalizeCombatRngState(Number.NaN)).toBe(COMBAT_RNG_DEFAULT_SEED)
    expect(normalizeCombatRngState(1.5)).toBe(COMBAT_RNG_DEFAULT_SEED)
    expect(normalizeCombatRngState(-1)).toBe(COMBAT_RNG_DEFAULT_SEED)
    expect(normalizeCombatRngState(7)).toBe(7)
  })

  it('adds the seed to V22 saves and preserves valid V23 state', () => {
    const initial = createInitialState()
    const legacy = migrateSave({ ...initial, saveVersion: 22, combat: { ...initial.combat, combatRngState: undefined } })
    expect(legacy.combat.combatRngState).toBe(COMBAT_RNG_DEFAULT_SEED)
    const current = migrateSave({ ...initial, saveVersion: 23, combat: { ...initial.combat, combatRngState: 123 } })
    expect(current.combat.combatRngState).toBe(123)
  })
})
