import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { RESONANCE_TYPES } from '../../content/resonance/resonance'
import { createEmptyResonanceState, grantResonance, grantResonanceBundle, normalizeResonanceState, resolveEnemyResonanceReward, sanitizeResonanceAmount, setResonance } from './resonanceRuntime'
import { resolveCombatLootContext } from '../loot/universalLootRuntime'

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

  it('resolves authored bundles with the universal Power-driven tier context', () => {
    const wisp = resolveEnemyResonanceReward('forest-wisp')
    expect(wisp).toMatchObject({ enemyId: 'forest-wisp', worldTier: 1, lootQuantityMultiplier: 1.15, bossQuantityMultiplier: 1, rewardMultiplier: 1.15, baseYield: { air: 10 }, finalYield: { air: 12 } })
    expect(wisp.lootTier).toBe(resolveCombatLootContext('forest-wisp', 1).lootTier.tier)
    const unprofiled = resolveEnemyResonanceReward('cavefang-wolf')
    expect(unprofiled).toMatchObject({ worldTier: 1, finalYield: {} })
    expect(unprofiled.rewardMultiplier).toBe(resolveCombatLootContext('cavefang-wolf', 1).lootTier.quantityMultiplier)
  })

  it('scales the authored bundle from effective encounter Power and boss status', () => {
    const wt1 = resolveEnemyResonanceReward('forest-wisp', 1)
    const wt5 = resolveEnemyResonanceReward('forest-wisp', 5)
    expect(wt1.rewardMultiplier).toBe(resolveCombatLootContext('forest-wisp', 1).lootTier.quantityMultiplier)
    expect(wt5.rewardMultiplier).toBe(resolveCombatLootContext('forest-wisp', 5).lootTier.quantityMultiplier)
    expect(wt5.finalYield.air).toBe(Math.round(10 * wt5.rewardMultiplier))
    const boss = resolveEnemyResonanceReward('forest-heart', 1)
    expect(boss.bossQuantityMultiplier).toBe(5)
    expect(Object.values(boss.finalYield).some((value) => value > 0)).toBe(true)
  })

  it('preserves small yields when combined scaling resolves to exactly one', () => {
    const original = MONSTERS['forest-wisp'].resonanceYield
    MONSTERS['forest-wisp'].resonanceYield = { air: 7 }
    try {
      const resolved = resolveEnemyResonanceReward('forest-wisp', 5)
      expect(resolved.finalYield).toEqual({ air: Math.round(7 * resolved.rewardMultiplier) })
    } finally {
      MONSTERS['forest-wisp'].resonanceYield = original
    }
  })
})
