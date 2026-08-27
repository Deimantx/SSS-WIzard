import { getEquippedReservedQuantity } from '../equipment/equipmentRules'
import type { GameState, ItemId } from '../../types'
import { getResearchReservedQuantity } from '../../systems/research/researchReservations'

const safeQuantity = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0

type ConsumableState = Pick<GameState, 'inventory' | 'protectedItems' | 'equipment'> & Partial<Pick<GameState, 'activities'>>

/** Returns copies available to gameplay consumers after all protected reservations. */
export function getConsumableQuantity(state: ConsumableState, itemId: ItemId) {
  if (state.protectedItems[itemId]) return 0
  const researchReserved = state.activities ? getResearchReservedQuantity(state as Pick<GameState, 'activities'>, itemId) : 0
  return Math.max(0, safeQuantity(state.inventory[itemId]) - getEquippedReservedQuantity(state, itemId) - researchReserved)
}

export const hasConsumableQuantity = (state: ConsumableState, itemId: ItemId, quantity: number) => getConsumableQuantity(state, itemId) >= Math.max(0, Math.floor(quantity))
