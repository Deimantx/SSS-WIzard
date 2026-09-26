import { ITEMS } from '../../game/content/items/items'
import { pushNotification, recalculateDerivedStats } from '../../game/engine'
import { evaluateEquipmentChange, type EquipmentChangeFailureReason } from '../../game/core/equipment'
import type { EquipmentPosition, GameState, ItemId } from '../../game/types'

export type EquipItemResult =
  | { ok: true; position: EquipmentPosition }
  | { ok: false; reason: EquipmentChangeFailureReason }

const failureMessage: Record<EquipmentChangeFailureReason, string> = {
  'missing-item': 'That item no longer exists.',
  'not-owned': 'You do not own this item.',
  'not-equipment': 'That item cannot be equipped.',
  incompatible: 'This item cannot be equipped in that slot.',
  'insufficient-copies': 'You do not own enough copies of this item.',
}

export const equipItemAction = (state: GameState, itemId: ItemId, targetPosition?: EquipmentPosition): EquipItemResult => {
  const item = ITEMS[itemId]
  const result = evaluateEquipmentChange(state, itemId, targetPosition)
  if (!result.ok) {
    pushNotification(state, failureMessage[result.reason], 'warning', { key: 'action-equip', cooldownMs: 1 })
    return result
  }

  state.equipment = result.nextEquipment
  recalculateDerivedStats(state)
  pushNotification(state, `${item.name} equipped`, 'success', { key: 'action-equip', cooldownMs: 1 })
  return { ok: true, position: result.position }
}

export type UnequipItemResult =
  | { ok: true; position: EquipmentPosition }
  | { ok: false; reason: 'not-equipped' }

export const unequipItemAction = (state: GameState, position: EquipmentPosition): UnequipItemResult => {
  const itemId = state.equipment[position]
  if (!Object.prototype.hasOwnProperty.call(state.equipment, position) || !itemId) return { ok: false, reason: 'not-equipped' }
  const nextEquipment = { ...state.equipment, [position]: null }
  state.equipment = nextEquipment
  recalculateDerivedStats(state)
  return { ok: true, position }
}
