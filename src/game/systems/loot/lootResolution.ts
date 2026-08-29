import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import type { GameState, ItemId, MonsterId } from '../../types'
import { grantItem } from '../inventory/itemAcquisition'

/** Resolves the current monster table into inventory changes and a readable log fragment. */
export function resolveMonsterLoot(state: GameState, enemyId: MonsterId, onDrop?: (itemId: ItemId, quantity: number) => void): string {
  const drops: string[] = []
  MONSTERS[enemyId].loot.forEach((drop) => {
    if (Math.random() <= drop.chance) {
      const quantity = Math.floor(drop.min + Math.random() * (drop.max - drop.min + 1))
      grantItem(state, drop.itemId, quantity)
      onDrop?.(drop.itemId, quantity)
      drops.push(`${quantity} ${ITEMS[drop.itemId].name}`)
    }
  })
  return drops.join(', ')
}
