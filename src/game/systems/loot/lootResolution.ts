import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import type { GameState, ItemId, MonsterId } from '../../types'
import { grantItem } from '../inventory/itemAcquisition'
import { getActiveEncounterWorldTier, resolveWorldTierLootQuantity } from '../world-tier/worldTierRuntime'

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
  return drops.join(', ')
}
