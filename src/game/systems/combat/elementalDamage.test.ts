import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { calculateCombatDamage } from './effectResolver'

describe('elemental damage resolution', () => {
  it.each([
    ['water', 1.5, 'strong'],
    ['earth', 0.5, 'resisted'],
    ['air', 1, 'neutral'],
    ['fire', 1, 'neutral'],
  ] as const)('resolves %s damage against a Fire affinity', (damageType, multiplier, matchup) => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.enemyId = 'fire-elemental'
    state.combat.enemyHp = state.combat.enemyMaxHp = 1000
    const result = calculateCombatDamage(state, 100, damageType, { actor: 'player', kind: 'spell', sourceId: 'test-spell', tags: ['spell', 'direct'] }, 'enemy', ['spell', 'direct'])
    expect(result.targetAffinity).toBe('fire')
    expect(result.affinityMultiplier).toBe(multiplier)
    expect(result.matchup).toBe(matchup)
    expect(result.damageAfterAffinity).toBeCloseTo(result.afterCrit * multiplier)
    expect(Number.isFinite(result.finalDamage)).toBe(true)
    expect(result.finalDamage).toBeGreaterThanOrEqual(0)
  })

  it('applies the same matchup multiplier to DoT damage', () => {
    const state = createInitialState()
    state.combat.enemyId = 'fire-elemental'
    const result = calculateCombatDamage(state, 10, 'water', { actor: 'player', kind: 'status', sourceId: 'test-dot', tags: ['dot'] }, 'enemy', ['dot'])
    expect(result.affinityMultiplier).toBe(1.5)
    expect(result.matchup).toBe('strong')
  })

  it('safely resolves non-finite input damage to a finite non-negative result', () => {
    const state = createInitialState()
    state.combat.enemyId = 'fire-elemental'
    const result = calculateCombatDamage(state, Number.NaN, 'water', { actor: 'player', kind: 'spell', sourceId: 'bad-test', tags: ['spell'] }, 'enemy', ['spell'])
    expect(result.finalDamage).toBe(0)
    expect(Number.isFinite(result.finalDamage)).toBe(true)
  })
})
