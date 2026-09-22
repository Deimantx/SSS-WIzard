import { MONSTERS } from '../../content/monsters'
import { resolveWorldTierLootQuantity, resolveWorldTierEnemyProfile } from '../../systems/world-tier/worldTierRuntime'
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
}

/** Read model for targeted-hunting reward inspection; it is transparent before Bestiary discovery. */
export const buildCombatTargetRewardPresentation = (monsterId: MonsterId, worldTier: WorldTierId): CombatTargetRewardPresentation => {
  const monster = MONSTERS[monsterId]
  const profile = resolveWorldTierEnemyProfile(monsterId, worldTier)
  const powerRating = resolveEnemyPowerRating(monsterId, worldTier)
  return {
    monsterId,
    monsterName: monster.name,
    itemDrops: monster.loot.map((drop) => ({
      itemId: drop.itemId,
      min: resolveWorldTierLootQuantity(drop.min, worldTier),
      max: resolveWorldTierLootQuantity(drop.max, worldTier),
      chance: drop.chance,
    })),
    resonance: profile.resonanceYield,
    powerRating,
    threatGain: powerRating,
    worldTier: profile.worldTier,
  }
}
