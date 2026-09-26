import { ITEMS } from '../../content/items/items'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import type { GameState, ItemId, MonsterId } from '../../types'
import { grantItem } from '../inventory/itemAcquisition'
import { getActiveEncounterWorldTier, resolveWorldTierLootQuantity } from '../world-tier/worldTierRuntime'
import { rollPowerScaledCurrencyReward } from './powerScaledCurrencyRewards'
import { getGuildProgressionBonuses } from '../guild/guildSelectors'

/** Resolves the authored material table into inventory changes and a readable log fragment. */
export function resolveMonsterLoot(state: GameState, enemyId: MonsterId, onDrop?: (itemId: ItemId, quantity: number) => void, rng: () => number = Math.random): string {
  const drops: string[] = []
  const encounterWorldTier = getActiveEncounterWorldTier(state)
  MONSTERS[enemyId].loot.forEach((drop) => {
    if (rng() > drop.chance) return
    const baseQuantity = Math.floor(drop.min + rng() * (drop.max - drop.min + 1))
    const quantity = resolveWorldTierLootQuantity(baseQuantity, encounterWorldTier)
    grantItem(state, drop.itemId, quantity)
    onDrop?.(drop.itemId, quantity)
    drops.push(`${quantity} ${ITEMS[drop.itemId].name}`)
  })
  const guildBonuses = getGuildProgressionBonuses(state)
  const isBoss = isBossMonster(MONSTERS[enemyId])
  const lifeEssenceQuantity = Math.max(1, Math.round(rollPowerScaledCurrencyReward(enemyId, 'life-essence', encounterWorldTier, rng) * guildBonuses.lifeEssenceMultiplier * (isBoss ? guildBonuses.bossEssenceMultiplier : 1)))
  grantItem(state, 'life-essence', lifeEssenceQuantity)
  onDrop?.('life-essence', lifeEssenceQuantity)
  drops.push(`${lifeEssenceQuantity} ${ITEMS['life-essence'].name}`)
  const artifactEssenceQuantity = Math.max(1, Math.round(rollPowerScaledCurrencyReward(enemyId, 'artifact-essence', encounterWorldTier, rng) * guildBonuses.artifactEssenceMultiplier * (isBoss ? guildBonuses.bossEssenceMultiplier : 1)))
  grantItem(state, 'artifact-essence', artifactEssenceQuantity)
  onDrop?.('artifact-essence', artifactEssenceQuantity)
  drops.push(`${artifactEssenceQuantity} ${ITEMS['artifact-essence'].name}`)
  return drops.join(', ')
}
