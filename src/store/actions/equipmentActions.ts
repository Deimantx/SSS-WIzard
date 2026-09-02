import { ITEMS } from '../../game/content/items/items'
import { pushNotification, recalculateDerivedStats } from '../../game/engine'
import { evaluateEquipmentChange, isTwoHandedWeapon, type EquipmentChangeFailureReason } from '../../game/core/equipment'
import type { EquipmentPosition, GameState, ItemId } from '../../game/types'

export type EquipItemResult =
  | { ok: true; position: EquipmentPosition; unequippedOffhand: ItemId | null }
  | { ok: false; reason: EquipmentChangeFailureReason }

const failureMessage: Record<EquipmentChangeFailureReason, string> = {
  'missing-item': 'That item no longer exists.',
  'not-owned': 'You do not own this item.',
  'not-equipment': 'That item cannot be equipped.',
  incompatible: 'This item cannot be equipped in that slot.',
  'ring-target-required': 'Choose Ring 1 or Ring 2 to replace.',
  'insufficient-copies': 'You do not own enough copies of this item.',
}

export const equipItemAction = (state: GameState, itemId: ItemId, targetPosition?: EquipmentPosition): EquipItemResult => {
  const item = ITEMS[itemId]
  const result = evaluateEquipmentChange(state, itemId, targetPosition)
  if (!result.ok) {
    const message = result.reason === 'incompatible' && item?.equipmentSlot === 'offhand' && isTwoHandedWeapon(state.equipment.weapon)
      ? 'Requires a one-handed Weapon.'
      : failureMessage[result.reason]
    pushNotification(state, message, 'warning')
    return result
  }

  const removedOffhand = result.removedOffhand
  state.equipment = result.nextEquipment
  recalculateDerivedStats(state)
  if (removedOffhand) pushNotification(state, `${item.name} equipped. ${ITEMS[removedOffhand]?.name ?? removedOffhand} was unequipped.`, 'success')
  else pushNotification(state, `${item.name} equipped`, 'success')
  return { ok: true, position: result.position, unequippedOffhand: removedOffhand }
}

export const unequipItemAction = (state: GameState, position: EquipmentPosition) => {
  if (!Object.prototype.hasOwnProperty.call(state.equipment, position)) return false
  if (!state.equipment[position]) return false
  state.equipment[position] = null
  recalculateDerivedStats(state)
  return true
}
