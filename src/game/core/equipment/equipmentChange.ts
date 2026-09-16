import { ITEMS } from '../../content/items/items'
import type { EquipmentPosition, GameState, ItemId } from '../../types'
import { getDefaultEquipmentPosition, isPositionCompatible } from './equipmentRules'

export type EquipmentChangeFailureReason = 'missing-item' | 'not-owned' | 'not-equipment' | 'incompatible' | 'insufficient-copies'

export type EquipmentChangeResult =
  | { ok: true; position: EquipmentPosition; nextEquipment: GameState['equipment'] }
  | { ok: false; reason: EquipmentChangeFailureReason }

export function evaluateEquipmentChange(state: Pick<GameState, 'inventory' | 'equipment'>, itemId: ItemId, requestedPosition?: EquipmentPosition): EquipmentChangeResult {
  const item = ITEMS[itemId]
  if (!item) return { ok: false, reason: 'missing-item' }
  if (item.kind !== 'equipment' || !item.equipmentSlot) return { ok: false, reason: 'not-equipment' }

  const position = requestedPosition ?? getDefaultEquipmentPosition(item.equipmentSlot)
  if (!position || !isPositionCompatible(item, position)) return { ok: false, reason: 'incompatible' }

  const owned = Math.max(0, Math.floor(state.inventory[itemId] ?? 0))
  if (owned < 1) return { ok: false, reason: 'not-owned' }

  const currentItem = state.equipment[position]
  if (currentItem === itemId) return { ok: true, position, nextEquipment: { ...state.equipment } }

  const equippedCopies = Object.values(state.equipment).filter((equippedItemId) => equippedItemId === itemId).length
  if (owned - equippedCopies < 1) return { ok: false, reason: 'insufficient-copies' }
  return { ok: true, position, nextEquipment: { ...state.equipment, [position]: itemId } }
}
