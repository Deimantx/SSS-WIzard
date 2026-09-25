import { MONSTERS } from '../../content/monsters'
import { normalizeResonanceState } from '../../content/resonance/resonance'
import { resolveLifeEssenceRewardRange } from '../../systems/loot/lifeEssenceReward'
import { resolveEnemyResonanceReward } from '../../systems/resonance/resonanceRuntime'
import { resolveWorldTierLootQuantity } from '../../systems/world-tier/worldTierRuntime'
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
  const resonanceReward = resolveEnemyResonanceReward(monsterId, worldTier)
  const lifeEssence = resolveLifeEssenceRewardRange(monsterId, worldTier)
  const powerRating = resolveEnemyPowerRating(monsterId, worldTier)
  return {
    monsterId,
    monsterName: monster.name,
    itemDrops: [
      ...monster.loot.map((drop) => ({
        itemId: drop.itemId,
        min: resolveWorldTierLootQuantity(drop.min, worldTier),
        max: resolveWorldTierLootQuantity(drop.max, worldTier),
        chance: drop.chance,
      })),
      { itemId: 'life-essence', min: lifeEssence.finalMin, max: lifeEssence.finalMax, chance: 1 },
    ],
    resonance: normalizeResonanceState(resonanceReward.finalYield),
    powerRating,
    threatGain: powerRating,
    worldTier: resonanceReward.worldTier,
  }
}
