import { UNIVERSAL_LOOT_BOSS_MULTIPLIERS, UNIVERSAL_LOOT_TIERS, UNIVERSAL_LOOT_SIGIL_QUALITY_WEIGHTS, type UniversalLootTierDefinition } from '../../content/loot/universalLootTiers'
import type { MonsterLootDropDefinition } from '../../content/loot/lootCategoryTypes'
import type { MonsterId, WorldTierId } from '../../types'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import { resolveEnemyPowerRating } from '../combat/enemyPower'

export interface CombatLootContext {
  enemyId: MonsterId
  locationId: import('../../types').CombatLocationId | null
  worldTier: WorldTierId
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

export const resolveCombatLootContext = (enemyId: MonsterId, worldTier: WorldTierId, locationId: CombatLootContext['locationId'] = null): CombatLootContext => {
  const effectivePower = resolveEnemyPowerRating(enemyId, worldTier)
  return { enemyId, locationId, worldTier, effectivePower, lootTier: resolveUniversalLootTier(effectivePower), isBoss: isBossMonster(MONSTERS[enemyId]) }
}

export const resolveLootMultiplier = (context: CombatLootContext, kind: 'quantity' | 'chance' | 'rarity', applyBoss = true) => {
  const base = kind === 'quantity' ? context.lootTier.quantityMultiplier : kind === 'chance' ? context.lootTier.chanceMultiplier : context.lootTier.rarityMultiplier
  return base * (applyBoss && context.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS[kind] : 1)
}

export const resolveLootChance = (baseChance: number, context: CombatLootContext, externalMultiplier = 1, applyBoss = true) => Math.min(1, Math.max(0, baseChance * resolveLootMultiplier(context, 'chance', applyBoss) * externalMultiplier))

/** One canonical successful-reward rounding policy, shared by all categories. */
export const roundLootQuantity = (target: number) => Math.max(1, Math.round(Number.isFinite(target) ? target : 1))

export const resolveLootQuantity = (quantity: number, context: CombatLootContext, externalMultiplier = 1, applyBoss = true) => roundLootQuantity(quantity * resolveLootMultiplier(context, 'quantity', applyBoss) * externalMultiplier)

export const resolveAuthoredLootDropChance = (drop: MonsterLootDropDefinition, context: CombatLootContext, externalMultiplier = 1) => {
  if (context.lootTier.tier < (drop.minLootTier ?? 1)) return 0
  const tier = drop.scaling?.tierChance === false ? 1 : context.lootTier.chanceMultiplier
  const boss = context.isBoss && drop.scaling?.bossChance !== false ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.chance : 1
  return Math.min(1, Math.max(0, drop.baseChance * tier * boss * externalMultiplier))
}

export const resolveAuthoredLootDropQuantity = (drop: MonsterLootDropDefinition, baseQuantity: number, context: CombatLootContext, externalMultiplier = 1) => {
  if (context.lootTier.tier < (drop.minLootTier ?? 1)) return 0
  const tier = drop.scaling?.tierQuantity === false ? 1 : context.lootTier.quantityMultiplier
  const boss = context.isBoss && drop.scaling?.bossQuantity !== false ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity : 1
  return roundLootQuantity(baseQuantity * tier * boss * externalMultiplier)
}

export const applyLootRarityMultiplier = <Rarity extends string>(weights: Record<Rarity, number>, multiplier: number): Record<Rarity, number> => {
  const boosted = Object.fromEntries((Object.entries(weights) as Array<[Rarity, number]>).map(([rarity, weight]) => [rarity, rarity === 'common' ? weight : weight * multiplier])) as Record<Rarity, number>
  const total = (Object.values(boosted) as number[]).reduce<number>((sum, value) => sum + Math.max(0, value), 0)
  if (total <= 0) return Object.fromEntries(Object.keys(weights).map((rarity) => [rarity, rarity === 'common' ? 100 : 0])) as Record<Rarity, number>
  return Object.fromEntries((Object.entries(boosted) as Array<[Rarity, number]>).map(([rarity, value]) => [rarity, Math.max(0, value) / total * 100])) as Record<Rarity, number>
}

export const resolveSigilDropQualityWeights = (context: CombatLootContext, sigilTier: number) => {
  const key = `${sigilTier}-${context.isBoss ? 'boss' : 'normal'}`
  const weights = UNIVERSAL_LOOT_SIGIL_QUALITY_WEIGHTS[key] ?? UNIVERSAL_LOOT_SIGIL_QUALITY_WEIGHTS[`${context.isBoss ? 2 : 2}-${context.isBoss ? 'boss' : 'normal'}`]
  return resolveLootRarityWeights(weights, context)
}

export const resolveLootRarityWeights = <Rarity extends string>(weights: Record<Rarity, number>, context: CombatLootContext, scaling: { tierRarity?: boolean; bossRarity?: boolean } = {}) => {
  const tier = scaling.tierRarity === false ? 1 : context.lootTier.rarityMultiplier
  const boss = context.isBoss && scaling.bossRarity !== false ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.rarity : 1
  return applyLootRarityMultiplier(weights, tier * boss)
}

export const resolveLootTierDistribution = (worldTier: WorldTierId, monsters: readonly MonsterId[], resolver = resolveCombatLootContext) => {
  const distribution: Record<number, MonsterId[]> = {}
  monsters.forEach((id) => {
    const tier = resolver(id, worldTier).lootTier.tier
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
