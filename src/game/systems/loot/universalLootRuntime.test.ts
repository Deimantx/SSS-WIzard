import { describe, expect, it } from 'vitest'
import { MONSTER_IDS, MONSTERS, isBossMonster } from '../../content/monsters'
import { LOOT_CATEGORY_RULES, SIGIL_DROP_QUALITY_BASE, UNIVERSAL_LOOT_BOSS_MULTIPLIERS, UNIVERSAL_LOOT_TIERS, getLootUnlockTier, isLootUnlockedAtTier, validateLootCategoryRules, validateUniversalLootTierDefinitions } from '../../content/loot/universalLootTiers'
import { applyLootRarityMultiplier, resolveAuthoredLootDrop, resolveAuthoredLootDropChance, resolveAuthoredLootDropQuantity, resolveAuthoredLootDropRarityWeights, resolveCombatLootContext, resolveLootChance, resolveLootQuantity, resolveLootRarityWeights, resolveLootScalingRules, resolveLootTierDistribution, resolveRareLootInstanceQuantity, resolveSigilDropQualityWeights, resolveUniversalLootTier } from './universalLootRuntime'

describe('universal loot tiers', () => {
  it('validates ordered thresholds and increasing authored curves', () => {
    const validation = validateUniversalLootTierDefinitions()
    expect(validation.errors).toEqual([])
    expect(validation.warnings).toEqual([])
    expect(UNIVERSAL_LOOT_TIERS).toHaveLength(20)
  })

  it('preserves every authored tier value in explicit registry rows', () => {
    expect(UNIVERSAL_LOOT_TIERS.map(({ minPower }) => minPower)).toEqual([0,250,500,750,1000,1500,2000,2750,3500,4500,5500,7000,8500,10000,12500,15000,18000,22000,27500,35000])
    expect(UNIVERSAL_LOOT_TIERS.map(({ quantityMultiplier }) => quantityMultiplier)).toEqual([1,1.15,1.3,1.5,1.75,2,2.3,2.6,3,3.5,4,4.6,5.2,6,7,8,9.2,10.5,12,14])
    expect(UNIVERSAL_LOOT_TIERS.map(({ chanceMultiplier }) => chanceMultiplier)).toEqual([1,1.05,1.1,1.15,1.2,1.25,1.3,1.35,1.4,1.5,1.6,1.7,1.8,1.9,2,2.15,2.3,2.5,2.75,3])
    expect(UNIVERSAL_LOOT_TIERS.map(({ rarityMultiplier }) => rarityMultiplier)).toEqual([1,1.03,1.06,1.10,1.14,1.18,1.22,1.27,1.32,1.38,1.44,1.50,1.57,1.64,1.72,1.80,1.88,1.96,2.05,2.15])
    expect(UNIVERSAL_LOOT_TIERS.map(({ sigilDropChance }) => sigilDropChance)).toEqual([.01,.012,.014,.016,.018,.02,.023,.026,.029,.032,.035,.038,.042,.046,.05,.055,.06,.065,.07,.08])
    expect(UNIVERSAL_LOOT_TIERS.map(({ crystalCacheDropChance }) => crystalCacheDropChance)).toEqual([0,0,0,0,0,0,0,0,0,.001,.0012,.0014,.0016,.0018,.002,.0023,.0026,.0029,.0032,.0035])
    expect(UNIVERSAL_LOOT_TIERS[19].tier).toBe(20)
  })

  it('resolves stable unlock IDs from the tier rows and inherits unlocks upward', () => {
    expect(getLootUnlockTier('crystal-cache-t1')).toBe(10)
    for (const [tier, unlocked] of [[9, false], [10, true], [11, true], [20, true]] as const) expect(isLootUnlockedAtTier('crystal-cache-t1', tier)).toBe(unlocked)
    const duplicateRow = [...UNIVERSAL_LOOT_TIERS]
    expect(validateUniversalLootTierDefinitions([{ ...duplicateRow[9], unlocks: ['crystal-cache-t1', 'crystal-cache-t1'] } as never]).errors.some((error) => error.includes('duplicate loot unlock'))).toBe(true)
    expect(validateUniversalLootTierDefinitions([{ ...duplicateRow[9], unlocks: ['not-real'] } as never]).errors.some((error) => error.includes('unknown loot unlock'))).toBe(true)
    expect(validateUniversalLootTierDefinitions([{ ...duplicateRow[9], tier: 1 }, { ...duplicateRow[10], tier: 2, unlocks: ['crystal-cache-t1'] }] as never).errors.some((error) => error.includes('authored more than once'))).toBe(true)
  })

  it('requires complete defaults for every loot category', () => {
    expect(validateLootCategoryRules()).toEqual([])
    expect(validateLootCategoryRules({ ...LOOT_CATEGORY_RULES, unique: undefined })).toContain('Missing loot category rules for unique')
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

  it('uses category defaults while allowing explicit per-drop overrides', () => {
    const boss = resolveCombatLootContext('forest-heart', 1)
    const material = { itemId: 'fire-fragment', category: 'material', baseChance: .01, quantity: { min: 1, max: 1 } } as const
    expect(resolveAuthoredLootDropChance(material, boss)).toBeCloseTo(.01 * boss.lootTier.chanceMultiplier * UNIVERSAL_LOOT_BOSS_MULTIPLIERS.chance)
    expect(resolveAuthoredLootDropQuantity(material, 1, boss)).toBe(Math.round(boss.lootTier.quantityMultiplier * UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity))
    expect(resolveLootRarityWeights({ common: 75, refined: 25 }, boss, resolveLootScalingRules('material'))).toEqual({ common: 75, refined: 25 })

    const equipment = { itemId: 'ember-staff', category: 'equipment', baseChance: .01, quantity: { min: 1, max: 1 } } as const
    expect(resolveAuthoredLootDropChance(equipment, boss)).toBeCloseTo(.01 * boss.lootTier.chanceMultiplier * UNIVERSAL_LOOT_BOSS_MULTIPLIERS.chance)
    expect(resolveAuthoredLootDropQuantity(equipment, 1, boss)).toBe(1)
    const rarity = resolveAuthoredLootDropRarityWeights(equipment, { common: 75, refined: 25 }, boss)
    expect(rarity.refined).toBeGreaterThan(25)

    const unique = { itemId: 'fire-fragment', category: 'unique', baseChance: .02, quantity: { min: 1, max: 1 }, scaling: { tierQuantity: false, tierChance: false, tierRarity: false, bossQuantity: false, bossChance: false, bossRarity: false } } as const
    const highTierBoss = { ...boss, lootTier: UNIVERSAL_LOOT_TIERS[19] }
    expect(resolveAuthoredLootDrop(unique, highTierBoss, () => 0)).toBe(1)
    expect(resolveAuthoredLootDropChance(unique, highTierBoss)).toBe(.02)
    expect(resolveAuthoredLootDropQuantity(unique, 1, highTierBoss)).toBe(1)
    const defaultUnique = { ...unique, scaling: undefined }
    expect(resolveAuthoredLootDropChance(defaultUnique, highTierBoss)).toBe(.02)
    expect(resolveAuthoredLootDropQuantity(defaultUnique, 1, highTierBoss)).toBe(1)

    const locked = { ...unique, minLootTier: boss.lootTier.tier + 1 }
    expect(resolveAuthoredLootDrop(locked, boss, () => 0)).toBeNull()
    expect(resolveAuthoredLootDropChance(locked, boss)).toBe(0)
    expect(resolveAuthoredLootDropQuantity(locked, locked.quantity.min, boss)).toBe(0)
  })

  it('applies Loot Tier and the canonical boss rarity multiplier once to shared Sigil profiles', () => {
    const baseContext = resolveCombatLootContext('forest-heart', 1)
    const highTier = { ...baseContext, lootTier: UNIVERSAL_LOOT_TIERS[19] }
    const normal = { ...highTier, isBoss: false }
    const boss = { ...highTier, isBoss: true }
    expect(SIGIL_DROP_QUALITY_BASE).toEqual({ 1: { common: 75, refined: 22, perfect: 2.8, legendary: .2 }, 2: { common: 55, refined: 32, perfect: 11, legendary: 2 } })
    const normalWeights = resolveSigilDropQualityWeights(normal, 1)
    const bossWeights = resolveSigilDropQualityWeights(boss, 1)
    expect(Object.entries(bossWeights).filter(([quality]) => quality !== 'common').reduce((sum, [, value]) => sum + value, 0)).toBeGreaterThan(Object.entries(normalWeights).filter(([quality]) => quality !== 'common').reduce((sum, [, value]) => sum + value, 0))
    expect(bossWeights).toEqual(applyLootRarityMultiplier(SIGIL_DROP_QUALITY_BASE[1], highTier.lootTier.rarityMultiplier * UNIVERSAL_LOOT_BOSS_MULTIPLIERS.rarity))
  })

  it('keeps successful Sigil and Crystal instance counts separate from the T20 quantity curve', () => {
    const normal = { ...resolveCombatLootContext('forest-wisp', 1), lootTier: UNIVERSAL_LOOT_TIERS[19], isBoss: false }
    const boss = { ...normal, isBoss: true }
    expect(resolveRareLootInstanceQuantity(normal)).toBe(1)
    expect(resolveRareLootInstanceQuantity(boss)).toBe(5)
    expect(normal.lootTier.quantityMultiplier).toBe(14)
  })

  it('normalizes tier rarity pressure after leaving the raw Common weight unchanged', () => {
    const adjusted = applyLootRarityMultiplier({ common: 75, refined: 20, perfect: 4, legendary: 1 }, 2)
    expect(Object.values(adjusted).reduce((sum, value) => sum + value, 0)).toBeCloseTo(100)
    expect(adjusted).toMatchObject({ common: 60, refined: 32, perfect: 6.4, legendary: 1.6 })
    expect(applyLootRarityMultiplier({ common: 75, uncommon: 20, rare: 5 }, 2)).toEqual({ common: 60, uncommon: 32, rare: 8 })
  })
})
