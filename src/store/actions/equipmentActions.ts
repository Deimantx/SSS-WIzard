import { ITEMS } from '../../game/content/items/items'
import { pushNotification, recalculateDerivedStats } from '../../game/engine'
import { evaluateEquipmentChange, type EquipmentChangeFailureReason } from '../../game/core/equipment'
import { validateFocusForEquipment, type FocusLoadoutValidation } from '../../game/systems/focus/focusLoadoutValidation'
import type { EquipmentPosition, GameState, ItemId } from '../../game/types'

export type EquipmentFocusFailure = { ok: false; reason: 'insufficient-focus-capacity'; deficit: number; maxFocus: number; usedFocus: number }
export type EquipItemResult =
  | { ok: true; position: EquipmentPosition }
  | { ok: false; reason: EquipmentChangeFailureReason }
  | EquipmentFocusFailure

const failureMessage: Record<EquipmentChangeFailureReason, string> = {
  'missing-item': 'That item no longer exists.',
  'not-owned': 'You do not own this item.',
  'not-equipment': 'That item cannot be equipped.',
  incompatible: 'This item cannot be equipped in that slot.',
  'ring-target-required': 'Choose Ring 1 or Ring 2 to replace.',
  'insufficient-copies': 'You do not own enough copies of this item.',
  'duplicate-ring': 'The same Ring cannot be equipped twice.',
}

const focusFailure = (validation: FocusLoadoutValidation): EquipmentFocusFailure => ({ ok: false, reason: 'insufficient-focus-capacity', deficit: validation.deficit, maxFocus: validation.maxFocus, usedFocus: validation.usedFocus })

export const equipItemAction = (state: GameState, itemId: ItemId, targetPosition?: EquipmentPosition): EquipItemResult => {
  const item = ITEMS[itemId]
  const result = evaluateEquipmentChange(state, itemId, targetPosition)
  if (!result.ok) {
    pushNotification(state, failureMessage[result.reason], 'warning', { key: 'action-equip', cooldownMs: 1 })
    return result
  }

  const focusValidation = validateFocusForEquipment(state, result.nextEquipment)
  if (!focusValidation.valid) {
    pushNotification(state, `Cannot equip ${item.name}. Free ${focusValidation.deficit} Focus first.`, 'warning', { key: 'action-equip-focus', cooldownMs: 1 })
    return focusFailure(focusValidation)
  }

  state.equipment = result.nextEquipment
  recalculateDerivedStats(state)
  pushNotification(state, `${item.name} equipped`, 'success', { key: 'action-equip', cooldownMs: 1 })
  return { ok: true, position: result.position }
}

export type UnequipItemResult =
  | { ok: true; position: EquipmentPosition }
  | { ok: false; reason: 'not-equipped' }
  | EquipmentFocusFailure

export const unequipItemAction = (state: GameState, position: EquipmentPosition): UnequipItemResult => {
  const itemId = state.equipment[position]
  if (!Object.prototype.hasOwnProperty.call(state.equipment, position) || !itemId) return { ok: false, reason: 'not-equipped' }
  const nextEquipment = { ...state.equipment, [position]: null }
  const focusValidation = validateFocusForEquipment(state, nextEquipment)
  if (!focusValidation.valid) {
    pushNotification(state, `Cannot unequip ${ITEMS[itemId].name}. Free ${focusValidation.deficit} Focus first.`, 'warning', { key: 'action-unequip-focus', cooldownMs: 1 })
    return focusFailure(focusValidation)
  }
  state.equipment = nextEquipment
  recalculateDerivedStats(state)
  return { ok: true, position }
}
