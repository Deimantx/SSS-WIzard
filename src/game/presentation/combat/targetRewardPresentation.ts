import { MONSTERS } from '../../content/monsters'
import { normalizeResonanceState } from '../../content/resonance/resonance'
import { resolveCombatCurrencyRewardRange } from '../../systems/loot/combatCurrencyRewards'
import { resolveEnemyResonanceReward } from '../../systems/resonance/resonanceRuntime'
import { resolveAuthoredLootDropChance, resolveAuthoredLootDropQuantity, resolveCombatLootContext } from '../../systems/loot/universalLootRuntime'
import { UNIVERSAL_LOOT_CRYSTAL_MIN_TIER, UNIVERSAL_LOOT_BOSS_MULTIPLIERS } from '../../content/loot/universalLootTiers'
import type { ItemId, MonsterId, ResonanceState, WorldTierId } from '../../types'
import { resolveEnemyPowerRating } from './enemyPowerRating'

export interface CombatTargetItemDropPresentation {
  itemId: ItemId
  min: number
  max: number
  chance: number
}

export interface CombatTargetRewardPresentation {
  monsterId: MonsterId
  monsterName: string
  itemDrops: CombatTargetItemDropPresentation[]
  resonance: ResonanceState
  powerRating: number
  threatGain: number
  worldTier: WorldTierId
  lootTier: number
  sigilDropChance: number
  expectedSigilQuantity: number
  crystalCacheDropChance: number
  expectedCrystalCacheQuantity: number
}

/** Read model for targeted-hunting reward inspection; it is transparent before Bestiary discovery. */
export const buildCombatTargetRewardPresentation = (monsterId: MonsterId, worldTier: WorldTierId): CombatTargetRewardPresentation => {
  const monster = MONSTERS[monsterId]
  const resonanceReward = resolveEnemyResonanceReward(monsterId, worldTier)
  const lifeEssence = resolveCombatCurrencyRewardRange(monsterId, 'life-essence', worldTier)
  const artifactEssence = resolveCombatCurrencyRewardRange(monsterId, 'artifact-essence', worldTier)
  const powerRating = resolveEnemyPowerRating(monsterId, worldTier)
  const lootContext = resolveCombatLootContext(monsterId, worldTier)
  return {
    monsterId,
    monsterName: monster.name,
    itemDrops: [
      ...monster.loot.map((drop) => ({
        itemId: drop.itemId,
        min: resolveAuthoredLootDropQuantity(drop, drop.quantity.min, lootContext),
        max: resolveAuthoredLootDropQuantity(drop, drop.quantity.max, lootContext),
        chance: resolveAuthoredLootDropChance(drop, lootContext),
      })),
      { itemId: 'life-essence', min: lifeEssence.finalMin, max: lifeEssence.finalMax, chance: 1 },
      { itemId: 'artifact-essence', min: artifactEssence.finalMin, max: artifactEssence.finalMax, chance: 1 },
    ],
    resonance: normalizeResonanceState(resonanceReward.finalYield),
    powerRating,
    threatGain: powerRating,
    worldTier: resonanceReward.worldTier,
    lootTier: lootContext.lootTier.tier,
    sigilDropChance: Math.min(1, lootContext.lootTier.sigilDropChance * (lootContext.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.chance : 1)),
    expectedSigilQuantity: Math.min(1, lootContext.lootTier.sigilDropChance * (lootContext.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.chance : 1)) * (lootContext.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity : 1),
    crystalCacheDropChance: lootContext.lootTier.tier < UNIVERSAL_LOOT_CRYSTAL_MIN_TIER ? 0 : Math.min(1, lootContext.lootTier.crystalCacheDropChance * (lootContext.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.chance : 1)),
    expectedCrystalCacheQuantity: lootContext.lootTier.tier < UNIVERSAL_LOOT_CRYSTAL_MIN_TIER ? 0 : Math.min(1, lootContext.lootTier.crystalCacheDropChance * (lootContext.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.chance : 1)) * (lootContext.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity : 1),
  }
}
