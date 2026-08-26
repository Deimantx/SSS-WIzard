import { ITEMS } from '../../game/content/items/items'
import { pushNotification } from '../../game/engine'
import { getEquippedReservedQuantity as getEquipmentReservedQuantity } from '../../game/core/equipment'
import type { GameState, ItemId } from '../../game/types'

export const isEquippedItem = (state: GameState, itemId: ItemId) => Object.values(state.equipment).includes(itemId)
export const isProtectedItem = (state: GameState, itemId: ItemId) => Boolean(state.protectedItems[itemId]) || isEquippedItem(state, itemId)

const safeQuantity = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
const safeGold = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value))) : 0

/** Number of copies reserved by equipment slots, independent of stack-level protection. */
export const getEquippedReservedQuantity = (state: Pick<GameState, 'equipment'>, itemId: ItemId) => getEquipmentReservedQuantity(state, itemId)
export const getActionableQuantity = (state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment'>, itemId: ItemId) => {
  if (state.protectedItems[itemId]) return 0
  return Math.max(0, safeQuantity(state.inventory[itemId]) - getEquippedReservedQuantity(state, itemId))
}
export const canSellItem = (state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment'>, itemId: ItemId) => Boolean(ITEMS[itemId]?.sellValue != null && getActionableQuantity(state, itemId) > 0)
export const canDestroyItem = (state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment'>, itemId: ItemId) => Boolean(ITEMS[itemId]?.canDestroy === true && getActionableQuantity(state, itemId) > 0)

export const addItemAction = (state: GameState, itemId: ItemId, quantity: number) => {
  const before = safeQuantity(state.inventory[itemId])
  state.inventory[itemId] = Math.max(0, before + (Number.isFinite(quantity) ? quantity : 0))
  return Math.max(0, state.inventory[itemId] - before)
}

export const removeItemAction = (state: GameState, itemId: ItemId, quantity: number) => { if (isProtectedItem(state, itemId)) { pushNotification(state, `${ITEMS[itemId].name} is protected or equipped`, 'warning'); return } state.inventory[itemId] = Math.max(0, safeQuantity(state.inventory[itemId]) - safeQuantity(quantity)) }
export const toggleItemProtectionAction = (state: GameState, itemId: ItemId) => { if (isEquippedItem(state, itemId)) { pushNotification(state, 'Equipped items are always protected.', 'warning'); return } state.protectedItems[itemId] = !state.protectedItems[itemId] }

const clampActionQuantity = (quantity: number, maximum: number) => Math.max(0, Math.min(maximum, safeQuantity(quantity)))
const itemQuantityLabel = (itemId: ItemId, quantity: number) => `${ITEMS[itemId].name}${quantity === 1 ? '' : 's'}`

export const sellItemAction = (state: GameState, itemId: ItemId, requestedQuantity: number) => {
  const item = ITEMS[itemId]
  const maximum = getActionableQuantity(state, itemId)
  const quantity = clampActionQuantity(requestedQuantity, maximum)
  if (!item || item.sellValue === null || maximum <= 0 || quantity < 1) {
    pushNotification(state, item && state.protectedItems[itemId] ? `${item.name} is protected. Unprotect it before selling.` : item && maximum === 0 && getEquippedReservedQuantity(state, itemId) > 0 ? 'The equipped copy cannot be sold.' : item ? `${item.name} cannot be sold.` : 'That item cannot be sold.', 'warning')
    return 0
  }
  const value = safeQuantity(item.sellValue)
  const reward = quantity * value
  const currentGold = safeGold(state.currencies.gold)
  if (!Number.isSafeInteger(reward) || currentGold > Number.MAX_SAFE_INTEGER - reward) {
    pushNotification(state, 'Gold limit reached. Nothing was sold.', 'warning')
    return 0
  }
  state.inventory[itemId] = Math.max(0, safeQuantity(state.inventory[itemId]) - quantity)
  state.currencies.gold = currentGold + reward
  pushNotification(state, `Sold ${itemQuantityLabel(itemId, quantity)} for ${reward.toLocaleString()} Gold.`, 'success')
  return quantity
}

export const destroyItemAction = (state: GameState, itemId: ItemId, requestedQuantity: number) => {
  const item = ITEMS[itemId]
  const maximum = getActionableQuantity(state, itemId)
  const quantity = clampActionQuantity(requestedQuantity, maximum)
  if (!item || item.canDestroy === false || maximum <= 0 || quantity < 1) {
    pushNotification(state, item && state.protectedItems[itemId] ? `${item.name} is protected. Unprotect it before destroying.` : item && item.canDestroy === false ? item.actionRestrictionReason ?? `${item.name} cannot be destroyed.` : item && maximum === 0 && getEquippedReservedQuantity(state, itemId) > 0 ? 'The equipped copy cannot be destroyed.' : 'That item cannot be destroyed.', 'warning')
    return 0
  }
  state.inventory[itemId] = Math.max(0, safeQuantity(state.inventory[itemId]) - quantity)
  pushNotification(state, `Destroyed ${itemQuantityLabel(itemId, quantity)}.`, 'success')
  return quantity
}
