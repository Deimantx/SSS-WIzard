import type { GameState, ItemId } from '../../types'
import { discoverItem } from '../collection/discovery'

/** The only gameplay primitive for adding a positive quantity of an item. */
export function grantItem(state: GameState, itemId: ItemId, quantity: number) {
  const amount = Number.isFinite(quantity) ? Math.floor(quantity) : 0
  if (amount <= 0) return 0
  state.inventory[itemId] = (state.inventory[itemId] ?? 0) + amount
  discoverItem(state, itemId)
  return amount
}
