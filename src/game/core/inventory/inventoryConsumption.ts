import { getEquippedReservedQuantity } from '../equipment/equipmentRules'
import type { GameState, ItemId } from '../../types'

const safeQuantity = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0

/** Returns copies available to gameplay consumers after manual protection and equipped reservations. */
export function getConsumableQuantity(state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment'>, itemId: ItemId) {
  if (state.protectedItems[itemId]) return 0
  return Math.max(0, safeQuantity(state.inventory[itemId]) - getEquippedReservedQuantity(state, itemId))
}

export const hasConsumableQuantity = (state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment'>, itemId: ItemId, quantity: number) => getConsumableQuantity(state, itemId) >= Math.max(0, Math.floor(quantity))
