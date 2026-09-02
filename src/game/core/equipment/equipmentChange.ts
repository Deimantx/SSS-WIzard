import { ITEMS } from '../../content/items/items'
import type { EquipmentPosition, GameState, ItemId } from '../../types'
import { EQUIPMENT_POSITIONS, isPositionCompatible, isTwoHandedWeapon } from './equipmentRules'

export type EquipmentChangeFailureReason =
  | 'missing-item'
  | 'not-owned'
  | 'not-equipment'
  | 'incompatible'
  | 'ring-target-required'
  | 'insufficient-copies'

export interface EquipmentChangeSuccess {
  ok: true
  position: EquipmentPosition
  nextEquipment: GameState['equipment']
  removedOffhand: ItemId | null
}

export interface EquipmentChangeFailure {
  ok: false
  reason: EquipmentChangeFailureReason
}

export type EquipmentChangeResult = EquipmentChangeSuccess | EquipmentChangeFailure

const isEquipmentPosition = (position: EquipmentPosition | undefined): position is EquipmentPosition => Boolean(position && EQUIPMENT_POSITIONS.includes(position))

const getRingTarget = (equipment: GameState['equipment'], targetPosition?: EquipmentPosition): EquipmentPosition | null => {
  if (targetPosition !== undefined) return targetPosition
  if (!equipment.ring1) return 'ring1'
  if (!equipment.ring2) return 'ring2'
  return null
}

const countEquipped = (equipment: GameState['equipment'], itemId: ItemId) => EQUIPMENT_POSITIONS.filter((position) => equipment[position] === itemId).length

/**
 * Evaluates a normal Equipment change without mutating the live state.
 * Store actions and read-model previews must use this same eligibility path.
 */
export const evaluateEquipmentChange = (
  state: Pick<GameState, 'equipment' | 'inventory'>,
  itemId: ItemId,
  targetPosition?: EquipmentPosition,
): EquipmentChangeResult => {
  const item = ITEMS[itemId]
  if (!item) return { ok: false, reason: 'missing-item' }
  if (item.kind !== 'equipment' || !item.equipmentSlot) return { ok: false, reason: 'not-equipment' }
  if (Math.max(0, Math.floor(state.inventory[itemId] ?? 0)) < 1) return { ok: false, reason: 'not-owned' }

  const position = item.equipmentSlot === 'ring'
    ? getRingTarget(state.equipment, targetPosition)
    : targetPosition ?? item.equipmentSlot as EquipmentPosition
  if (!position) return { ok: false, reason: 'ring-target-required' }
  if (!isEquipmentPosition(position) || !isPositionCompatible(itemId, position)) return { ok: false, reason: 'incompatible' }
  if (item.equipmentSlot === 'offhand' && isTwoHandedWeapon(state.equipment.weapon)) return { ok: false, reason: 'incompatible' }

  const replacedSameCopy = state.equipment[position] === itemId ? 1 : 0
  const ownedCopies = Math.max(0, Math.floor(state.inventory[itemId] ?? 0))
  if (countEquipped(state.equipment, itemId) - replacedSameCopy + 1 > ownedCopies) return { ok: false, reason: 'insufficient-copies' }

  const nextEquipment = { ...state.equipment }
  const removedOffhand = isTwoHandedWeapon(itemId) ? nextEquipment.offhand : null
  if (removedOffhand) nextEquipment.offhand = null
  nextEquipment[position] = itemId
  return { ok: true, position, nextEquipment, removedOffhand }
}
