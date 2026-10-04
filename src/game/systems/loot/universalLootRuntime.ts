import { LOOT_CATEGORY_RULES, SIGIL_DROP_QUALITY_BASE, UNIVERSAL_LOOT_BOSS_MULTIPLIERS, UNIVERSAL_LOOT_TIERS, type UniversalLootTierDefinition } from '../../content/loot/universalLootTiers'
import type { LootCategory, LootScalingRules, MonsterLootDropDefinition } from '../../content/loot/lootCategoryTypes'
import type { MonsterId } from '../../types'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import { resolveEnemyPowerRating } from '../combat/enemyPower'

export interface CombatLootContext {
  enemyId: MonsterId
  locationId: import('../../types').CombatLocationId | null
  effectivePower: number
  lootTier: UniversalLootTierDefinition
  isBoss: boolean
  guildBonuses?: {
    lifeEssenceMultiplier: number
    artifactEssenceMultiplier: number
    bossEssenceMultiplier: number
    crystalCacheChanceMultiplier: number
    combatResonanceMultiplier: number
    combatArcanePointMultiplier: number
  }
  hunterBonuses?: { itemDropMultiplier?: number; essenceMultiplier?: number; sigilDropMultiplier?: number; resonanceMultiplier?: number }
}

export const resolveUniversalLootTier = (effectivePower: number): UniversalLootTierDefinition => {
  const power = Number.isFinite(effectivePower) ? Math.max(0, effectivePower) : 0
  return UNIVERSAL_LOOT_TIERS.reduce((selected, tier) => tier.minPower <= power ? tier : selected, UNIVERSAL_LOOT_TIERS[0])
}

export const resolveCombatLootContext = (enemyId: MonsterId, locationId: CombatLootContext['locationId'] = null): CombatLootContext => {
  const effectivePower = resolveEnemyPowerRating(enemyId)
  return { enemyId, locationId, effectivePower, lootTier: resolveUniversalLootTier(effectivePower), isBoss: isBossMonster(MONSTERS[enemyId]) }
}

export const resolveLootMultiplier = (context: CombatLootContext, kind: 'quantity' | 'chance' | 'rarity', applyBoss = true) => {
  const base = kind === 'quantity' ? context.lootTier.quantityMultiplier : kind === 'chance' ? context.lootTier.chanceMultiplier : context.lootTier.rarityMultiplier
  return base * (applyBoss && context.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS[kind] : 1)
}

/** Sigils and Crystal Caches are discrete reward instances; tier quantity never scales a successful roll. */
export const resolveRareLootInstanceQuantity = (context: Pick<CombatLootContext, 'isBoss'>) => context.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity : 1

export const resolveLootChance = (baseChance: number, context: CombatLootContext, externalMultiplier = 1, applyBoss = true) => Math.min(1, Math.max(0, baseChance * resolveLootMultiplier(context, 'chance', applyBoss) * externalMultiplier))

/** One canonical successful-reward rounding policy, shared by all categories. */
export const roundLootQuantity = (target: number) => Math.max(1, Math.round(Number.isFinite(target) ? target : 1))

export const resolveLootQuantity = (quantity: number, context: CombatLootContext, externalMultiplier = 1, applyBoss = true) => roundLootQuantity(quantity * resolveLootMultiplier(context, 'quantity', applyBoss) * externalMultiplier)

export const resolveLootScalingRules = (category: LootCategory, overrides: LootScalingRules = {}) => ({
  tierQuantity: overrides.tierQuantity ?? LOOT_CATEGORY_RULES[category].tierQuantity,
  tierChance: overrides.tierChance ?? LOOT_CATEGORY_RULES[category].tierChance,
  tierRarity: overrides.tierRarity ?? LOOT_CATEGORY_RULES[category].tierRarity,
  bossQuantity: overrides.bossQuantity ?? LOOT_CATEGORY_RULES[category].bossQuantity,
  bossChance: overrides.bossChance ?? LOOT_CATEGORY_RULES[category].bossChance,
  bossRarity: overrides.bossRarity ?? LOOT_CATEGORY_RULES[category].bossRarity,
})

export const resolveAuthoredLootDropChance = (drop: MonsterLootDropDefinition, context: CombatLootContext, externalMultiplier = 1) => {
  if (context.lootTier.tier < (drop.minLootTier ?? 1)) return 0
  const scaling = resolveLootScalingRules(drop.category, drop.scaling)
  const tier = scaling.tierChance ? context.lootTier.chanceMultiplier : 1
  const boss = context.isBoss && scaling.bossChance ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.chance : 1
  return Math.min(1, Math.max(0, drop.baseChance * tier * boss * externalMultiplier))
}

export const resolveAuthoredLootDropQuantity = (drop: MonsterLootDropDefinition, baseQuantity: number, context: CombatLootContext, externalMultiplier = 1) => {
  if (context.lootTier.tier < (drop.minLootTier ?? 1)) return 0
  const scaling = resolveLootScalingRules(drop.category, drop.scaling)
  const tier = scaling.tierQuantity ? context.lootTier.quantityMultiplier : 1
  const boss = context.isBoss && scaling.bossQuantity ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity : 1
  return roundLootQuantity(baseQuantity * tier * boss * externalMultiplier)
}

export const applyLootRarityMultiplier = <Rarity extends string>(weights: Record<Rarity, number>, multiplier: number): Record<Rarity, number> => {
  const boosted = Object.fromEntries((Object.entries(weights) as Array<[Rarity, number]>).map(([rarity, weight]) => [rarity, rarity === 'common' ? weight : weight * multiplier])) as Record<Rarity, number>
  const total = (Object.values(boosted) as number[]).reduce<number>((sum, value) => sum + Math.max(0, value), 0)
  if (total <= 0) return Object.fromEntries(Object.keys(weights).map((rarity) => [rarity, rarity === 'common' ? 100 : 0])) as Record<Rarity, number>
  return Object.fromEntries((Object.entries(boosted) as Array<[Rarity, number]>).map(([rarity, value]) => [rarity, Math.max(0, value) / total * 100])) as Record<Rarity, number>
}

export const resolveSigilDropQualityWeights = (context: CombatLootContext, sigilTier: number) => {
  const weights = SIGIL_DROP_QUALITY_BASE[sigilTier] ?? SIGIL_DROP_QUALITY_BASE[2]
  return resolveLootRarityWeights(weights, context, resolveLootScalingRules('sigil'))
}

export const resolveLootRarityWeights = <Rarity extends string>(weights: Record<Rarity, number>, context: CombatLootContext, scaling: Pick<Required<LootScalingRules>, 'tierRarity' | 'bossRarity'> = LOOT_CATEGORY_RULES.equipment) => {
  const tier = scaling.tierRarity ? context.lootTier.rarityMultiplier : 1
  const boss = context.isBoss && scaling.bossRarity ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.rarity : 1
  return applyLootRarityMultiplier(weights, tier * boss)
}

export const resolveAuthoredLootDropRarityWeights = <Rarity extends string>(drop: MonsterLootDropDefinition, weights: Record<Rarity, number>, context: CombatLootContext) =>
  resolveLootRarityWeights(weights, context, resolveLootScalingRules(drop.category, drop.scaling))

export const resolveLootTierDistribution = (monsters: readonly MonsterId[], resolver = resolveCombatLootContext) => {
  const distribution: Record<number, MonsterId[]> = {}
  monsters.forEach((id) => {
    const tier = resolver(id).lootTier.tier
    ;(distribution[tier] ??= []).push(id)
  })
  return distribution
}

export const resolveAuthoredLootDrop = (drop: MonsterLootDropDefinition, context: CombatLootContext, rng: () => number, externalChanceMultiplier = 1, externalQuantityMultiplier = 1): number | null => {
  if (context.lootTier.tier < (drop.minLootTier ?? 1)) return null
  const chance = resolveAuthoredLootDropChance(drop, context, externalChanceMultiplier)
  const roll = rng()
  const normalizedRoll = Number.isFinite(roll) ? Math.min(1 - Number.EPSILON, Math.max(0, roll)) : 0
  if (normalizedRoll >= chance) return null
  const quantityRoll = rng()
  const normalizedQuantityRoll = Number.isFinite(quantityRoll) ? Math.min(1 - Number.EPSILON, Math.max(0, quantityRoll)) : 0
  const baseQuantity = Math.floor(drop.quantity.min + normalizedQuantityRoll * (drop.quantity.max - drop.quantity.min + 1))
  return resolveAuthoredLootDropQuantity(drop, baseQuantity, context, externalQuantityMultiplier)
}
