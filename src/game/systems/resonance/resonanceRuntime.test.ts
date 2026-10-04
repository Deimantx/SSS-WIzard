import { describe, expect, it } from 'vitest'
import { ARCANE_PRIMARY_RESONANCE_AUDIT, MONSTERS } from '../../content/monsters'
import { RESONANCE_TYPES } from '../../content/resonance/resonance'
import { createEmptyResonanceState, grantResonance, grantResonanceBundle, normalizeResonanceState, resolveEnemyResonanceReward, sanitizeResonanceAmount, setResonance, spendResonanceBundle } from './resonanceRuntime'
import { resolveCombatLootContext } from '../loot/universalLootRuntime'

describe('Resonance runtime', () => {
  it('creates the four school balances plus Arcane Resonance', () => {
    expect(RESONANCE_TYPES).toEqual(['fire', 'water', 'earth', 'air', 'arcane'])
    expect(createEmptyResonanceState()).toEqual({ fire: 0, water: 0, earth: 0, air: 0, arcane: 0 })
    expect(normalizeResonanceState({ fire: 4 })).toEqual({ fire: 4, water: 0, earth: 0, air: 0, arcane: 0 })
  })

  it('grants, spends, and resolves Arcane Resonance for Arcane enemies', () => {
    const state = createEmptyResonanceState()
    expect(grantResonance(state, 'arcane', 35)).toBe(35)
    expect(setResonance(state, 'arcane', 12)).toBe(12)
    expect(spendResonanceBundle(state, { arcane: 5 })).toBe(true)
    expect(state.arcane).toBe(7)
    expect(resolveEnemyResonanceReward('runesunk-oracle').finalYield.arcane).toBeGreaterThan(0)
    expect(resolveEnemyResonanceReward('unmade-magister').finalYield.air).toBeGreaterThan(0)
  })

  it('gives every Arcane-primary enemy a dominant Arcane reward while preserving secondary yields', () => {
    expect(ARCANE_PRIMARY_RESONANCE_AUDIT).toHaveLength(41)
    for (const { id, resonanceYield } of ARCANE_PRIMARY_RESONANCE_AUDIT) {
      const yieldProfile = resonanceYield ?? {}
      expect(yieldProfile.arcane, id).toBeGreaterThan(0)
      expect(yieldProfile.arcane, id).toBeGreaterThanOrEqual(Math.max(0, ...Object.entries(yieldProfile).filter(([type]) => type !== 'arcane').map(([, amount]) => amount ?? 0)))
    }
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
    expect(state).toEqual({ fire: 5, water: 0, earth: 0, air: 7, arcane: 0 })
  })

  it('resolves authored bundles with the universal Power-driven tier context', () => {
    const wisp = resolveEnemyResonanceReward('forest-wisp')
    expect(wisp).toMatchObject({ enemyId: 'forest-wisp', lootQuantityMultiplier: 1.15, bossQuantityMultiplier: 1, rewardMultiplier: 1.15, baseYield: { air: 10 }, finalYield: { air: 12 } })
    expect(wisp.lootTier).toBe(resolveCombatLootContext('forest-wisp').lootTier.tier)
    const unprofiled = resolveEnemyResonanceReward('cavefang-wolf')
    expect(unprofiled).toMatchObject({ finalYield: {} })
    expect(unprofiled.rewardMultiplier).toBe(resolveCombatLootContext('cavefang-wolf').lootTier.quantityMultiplier)
  })

  it('scales the authored bundle from canonical Power and boss status', () => {
    const first = resolveEnemyResonanceReward('forest-wisp')
    const repeat = resolveEnemyResonanceReward('forest-wisp')
    expect(first.rewardMultiplier).toBe(resolveCombatLootContext('forest-wisp').lootTier.quantityMultiplier)
    expect(repeat.rewardMultiplier).toBe(resolveCombatLootContext('forest-wisp').lootTier.quantityMultiplier)
    expect(repeat.finalYield.air).toBe(Math.round(10 * repeat.rewardMultiplier))
    const boss = resolveEnemyResonanceReward('forest-heart')
    expect(boss.bossQuantityMultiplier).toBe(5)
    expect(Object.values(boss.finalYield).some((value) => value > 0)).toBe(true)
  })

  it('preserves small yields when combined scaling resolves to exactly one', () => {
    const original = MONSTERS['forest-wisp'].resonanceYield
    MONSTERS['forest-wisp'].resonanceYield = { air: 7 }
    try {
      const resolved = resolveEnemyResonanceReward('forest-wisp')
      expect(resolved.finalYield).toEqual({ air: Math.round(7 * resolved.rewardMultiplier) })
    } finally {
      MONSTERS['forest-wisp'].resonanceYield = original
    }
  })
})
