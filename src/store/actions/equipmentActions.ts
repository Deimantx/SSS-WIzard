import { ITEMS } from '../../game/content/items/items'
import { pushNotification, recalculateDerivedStats } from '../../game/engine'
import { EQUIPMENT_POSITIONS, isPositionCompatible, isTwoHandedWeapon } from '../../game/core/equipment'
import type { EquipmentPosition, GameState, ItemId } from '../../game/types'

export type EquipItemResult =
  | { ok: true; position: EquipmentPosition; unequippedOffhand: ItemId | null }
  | { ok: false; reason: 'missing-item' | 'not-owned' | 'not-equipment' | 'incompatible' | 'ring-target-required' | 'insufficient-copies' }

const getRingTarget = (state: GameState, targetPosition?: EquipmentPosition): EquipmentPosition | null => {
  if (targetPosition !== undefined) return targetPosition === 'ring1' || targetPosition === 'ring2' ? targetPosition : null
  if (!state.equipment.ring1) return 'ring1'
  if (!state.equipment.ring2) return 'ring2'
  return null
}

const countEquipped = (state: GameState, itemId: ItemId) => EQUIPMENT_POSITIONS.filter((position) => state.equipment[position] === itemId).length

export const equipItemAction = (state: GameState, itemId: ItemId, targetPosition?: EquipmentPosition): EquipItemResult => {
  const item = ITEMS[itemId]
  if (!item) return { ok: false, reason: 'missing-item' }
  if (item.kind !== 'equipment' || !item.equipmentSlot) return { ok: false, reason: 'not-equipment' }
  if ((state.inventory[itemId] ?? 0) < 1) return { ok: false, reason: 'not-owned' }

  const position = item.equipmentSlot === 'ring' ? getRingTarget(state, targetPosition) : targetPosition ?? item.equipmentSlot as EquipmentPosition
  if (!position) {
    pushNotification(state, 'Choose Ring 1 or Ring 2 to replace.', 'warning')
    return { ok: false, reason: 'ring-target-required' }
  }
  if (!isPositionCompatible(itemId, position)) return { ok: false, reason: 'incompatible' }
  if (item.equipmentSlot === 'offhand' && isTwoHandedWeapon(state.equipment.weapon)) {
    pushNotification(state, 'Requires a one-handed Weapon.', 'warning')
    return { ok: false, reason: 'incompatible' }
  }

  const oldAtPosition = state.equipment[position]
  const ownedCopies = Math.max(0, Math.floor(state.inventory[itemId] ?? 0))
  const currentlyEquippedCopies = countEquipped(state, itemId)
  const copiesFreedByReplacement = oldAtPosition === itemId ? 1 : 0
  if (currentlyEquippedCopies - copiesFreedByReplacement + 1 > ownedCopies) {
    pushNotification(state, 'You do not own enough copies of this item.', 'warning')
    return { ok: false, reason: 'insufficient-copies' }
  }
  if (oldAtPosition === itemId && !(isTwoHandedWeapon(itemId) && state.equipment.offhand)) return { ok: true, position, unequippedOffhand: null }

  const removedOffhand = isTwoHandedWeapon(itemId) ? state.equipment.offhand : null
  if (removedOffhand) state.equipment.offhand = null
  state.equipment[position] = itemId
  recalculateDerivedStats(state)
  if (removedOffhand) pushNotification(state, `${item.name} equipped. ${ITEMS[removedOffhand]?.name ?? removedOffhand} was unequipped.`, 'success')
  else pushNotification(state, `${item.name} equipped`, 'success')
  return { ok: true, position, unequippedOffhand: removedOffhand }
}

export const unequipItemAction = (state: GameState, position: EquipmentPosition) => {
  if (!EQUIPMENT_POSITIONS.includes(position)) return false
  if (!state.equipment[position]) return false
  state.equipment[position] = null
  recalculateDerivedStats(state)
  return true
}
