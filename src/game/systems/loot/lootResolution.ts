import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters/whisperingWoods'
import type { GameState, MonsterId } from '../../types'

/** Resolves the current monster table into inventory changes and a readable log fragment. */
export function resolveMonsterLoot(state: GameState, enemyId: MonsterId): string {
  const drops: string[] = []
  MONSTERS[enemyId].loot.forEach((drop) => {
    if (Math.random() <= drop.chance) {
      const quantity = Math.floor(drop.min + Math.random() * (drop.max - drop.min + 1))
      state.inventory[drop.itemId] = (state.inventory[drop.itemId] ?? 0) + quantity
      drops.push(`${quantity} ${ITEMS[drop.itemId].name}`)
    }
  })
  return drops.join(', ')
}
