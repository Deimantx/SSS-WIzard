import { ITEMS } from '../../game/content/items/items'
import { pushNotification } from '../../game/engine'
import type { GameState, ItemId } from '../../game/types'

export const isEquippedItem = (state: GameState, itemId: ItemId) => Object.values(state.equipment).includes(itemId)
export const isProtectedItem = (state: GameState, itemId: ItemId) => Boolean(state.protectedItems[itemId]) || isEquippedItem(state, itemId)
export const addItemAction = (state: GameState, itemId: ItemId, quantity: number) => {
  const before = state.inventory[itemId] ?? 0
  state.inventory[itemId] = Math.max(0, before + quantity)
  return Math.max(0, state.inventory[itemId] - before)
}
export const removeItemAction = (state: GameState, itemId: ItemId, quantity: number) => { if (isProtectedItem(state, itemId)) { pushNotification(state, `${ITEMS[itemId].name} is protected or equipped`, 'warning'); return } state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) - quantity) }
export const toggleItemProtectionAction = (state: GameState, itemId: ItemId) => { if (isEquippedItem(state, itemId)) { pushNotification(state, 'Equipped items are always protected.', 'warning'); return } state.protectedItems[itemId] = !state.protectedItems[itemId] }
