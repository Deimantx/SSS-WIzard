import { describe, expect, it } from 'vitest'
import { RESONANCE_TYPES } from '../../content/resonance/resonance'
import { createEmptyResonanceState, grantResonance, grantResonanceBundle, normalizeResonanceState, resolveEnemyResonanceReward, sanitizeResonanceAmount, setResonance } from './resonanceRuntime'

describe('Resonance runtime', () => {
  it('creates exactly the four Phase 1 balances', () => {
    expect(RESONANCE_TYPES).toEqual(['fire', 'water', 'earth', 'air'])
    expect(createEmptyResonanceState()).toEqual({ fire: 0, water: 0, earth: 0, air: 0 })
  })

  it.each([
    [-4, 0], [3.9, 3], [Number.NaN, 0], [Number.POSITIVE_INFINITY, 0], [Number.NEGATIVE_INFINITY, 0], ['12', 0], [null, 0], [undefined, 0], [Number.MAX_SAFE_INTEGER + 1000, Number.MAX_SAFE_INTEGER],
  ])('sanitizes %s to %s', (value, expected) => expect(sanitizeResonanceAmount(value)).toBe(expected))

  it('grants, sets, and saturates safely', () => {
    const state = createEmptyResonanceState()
    grantResonance(state, 'earth', 20)
    expect(state.earth).toBe(20)
    setResonance(state, 'earth', Number.MAX_SAFE_INTEGER - 5)
    expect(grantResonance(state, 'earth', 100)).toBe(5)
    expect(state.earth).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('normalizes malformed records and grants bundles without touching unspecified types', () => {
    const state = normalizeResonanceState({ fire: 2.9, water: -2, earth: Number.POSITIVE_INFINITY, unknown: 99 })
    grantResonanceBundle(state, { fire: 3, air: 7 })
    expect(state).toEqual({ fire: 5, water: 0, earth: 0, air: 7 })
  })

  it('resolves authored and missing enemy profiles through the WT1 seam', () => {
    expect(resolveEnemyResonanceReward('forest-wisp')).toMatchObject({ enemyId: 'forest-wisp', worldTier: 1, worldTierRewardMultiplier: 1, globalRewardMultiplier: 0.2, rewardMultiplier: 0.2, baseYield: { air: 10 }, finalYield: { air: 2 } })
    expect(resolveEnemyResonanceReward('cavefang-wolf')).toMatchObject({ worldTier: 1, rewardMultiplier: 0.2, finalYield: {} })
  })

  it('combines World Tier and global scaling before sanitizing quantities', () => {
    const wt1 = resolveEnemyResonanceReward('forest-wisp', 1)
    const wt5 = resolveEnemyResonanceReward('forest-wisp', 5)
    expect(wt1.rewardMultiplier).toBe(0.2)
    expect(wt5.rewardMultiplier).toBe(1)
    expect(wt5.finalYield).toEqual({ air: 10 })
  })
})
