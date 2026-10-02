import { describe, expect, it } from 'vitest'
import { MONSTER_IDS, MONSTERS, isBossMonster } from '../../content/monsters'
import { UNIVERSAL_LOOT_BOSS_MULTIPLIERS, UNIVERSAL_LOOT_TIERS, validateUniversalLootTierDefinitions } from '../../content/loot/universalLootTiers'
import { applyLootRarityMultiplier, resolveAuthoredLootDrop, resolveAuthoredLootDropChance, resolveAuthoredLootDropQuantity, resolveCombatLootContext, resolveLootChance, resolveLootQuantity, resolveLootTierDistribution, resolveUniversalLootTier } from './universalLootRuntime'

describe('universal loot tiers', () => {
  it('validates ordered thresholds and increasing authored curves', () => {
    const validation = validateUniversalLootTierDefinitions()
    expect(validation.errors).toEqual([])
    expect(validation.warnings).toEqual([])
    expect(UNIVERSAL_LOOT_TIERS).toHaveLength(20)
  })

  it('selects the highest threshold at or below effective Power and leaves the top tier open ended', () => {
    expect(resolveUniversalLootTier(0).tier).toBe(1)
    expect(resolveUniversalLootTier(249).tier).toBe(1)
    expect(resolveUniversalLootTier(250).tier).toBe(2)
    expect(resolveUniversalLootTier(1_000_000).tier).toBe(20)
  })

  it('derives encounter Loot Tier from canonical effective Power across World Tiers', () => {
    for (const enemyId of MONSTER_IDS) {
      for (const worldTier of [1, 2, 3, 4, 5] as const) {
        const context = resolveCombatLootContext(enemyId, worldTier)
        expect(context.lootTier.tier).toBe(resolveUniversalLootTier(context.effectivePower).tier)
      }
    }
  })

  it('applies the authored fivefold boss quantity and chance after tier scaling', () => {
    const bossId = MONSTER_IDS.find((id) => isBossMonster(MONSTERS[id]))!
    const context = resolveCombatLootContext(bossId, 1)
    expect(UNIVERSAL_LOOT_BOSS_MULTIPLIERS).toEqual({ quantity: 5, chance: 5, rarity: 5 })
    expect(resolveLootQuantity(1, context)).toBe(Math.round(context.lootTier.quantityMultiplier * 5))
    expect(resolveLootChance(.01, context)).toBeCloseTo(Math.min(1, .01 * context.lootTier.chanceMultiplier * 5))
  })

  it('builds tier coverage by World Tier from registered monsters', () => {
    const coverage = resolveLootTierDistribution(1, MONSTER_IDS)
    expect(Object.values(coverage).flat().sort()).toEqual([...MONSTER_IDS].sort())
  })

  it('supports category-agnostic fixed reward escape rules and minimum-tier locks', () => {
    const context = resolveCombatLootContext('forest-heart', 1)
    const unique = { itemId: 'fire-fragment', category: 'unique', baseChance: 1, quantity: { min: 2, max: 2 }, scaling: { tierQuantity: false, chance: false, bossQuantity: false, bossChance: false } } as const
    expect(resolveAuthoredLootDrop(unique, context, () => 0)).toBe(2)
    expect(resolveAuthoredLootDropChance(unique, context)).toBe(1)
    expect(resolveAuthoredLootDropQuantity(unique, unique.quantity.min, context)).toBe(2)
    const locked = { ...unique, minLootTier: context.lootTier.tier + 1 }
    expect(resolveAuthoredLootDrop(locked, context, () => 0)).toBeNull()
    expect(resolveAuthoredLootDropChance(locked, context)).toBe(0)
    expect(resolveAuthoredLootDropQuantity(locked, locked.quantity.min, context)).toBe(0)
  })

  it('normalizes tier rarity pressure after leaving the raw Common weight unchanged', () => {
    const adjusted = applyLootRarityMultiplier({ common: 75, refined: 20, perfect: 4, legendary: 1 }, 2)
    expect(Object.values(adjusted).reduce((sum, value) => sum + value, 0)).toBeCloseTo(100)
    expect(adjusted).toMatchObject({ common: 60, refined: 32, perfect: 6.4, legendary: 1.6 })
    expect(applyLootRarityMultiplier({ common: 75, uncommon: 20, rare: 5 }, 2)).toEqual({ common: 60, uncommon: 32, rare: 8 })
  })
})
