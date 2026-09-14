import { ITEMS } from '../../content/items/items'
import type { EquipmentPosition, GameState, ItemId } from '../../types'
import { EQUIPMENT_POSITIONS, getDefaultEquipmentPosition, isPositionCompatible } from './equipmentRules'

export type EquipmentChangeFailureReason =
  | 'missing-item'
  | 'not-owned'
  | 'not-equipment'
  | 'incompatible'
  | 'ring-target-required'
  | 'earring-target-required'
  | 'insufficient-copies'
  | 'duplicate-ring'
  | 'duplicate-earring'

export interface EquipmentChangeSuccess {
  ok: true
  position: EquipmentPosition
  nextEquipment: GameState['equipment']
}

export interface EquipmentChangeFailure {
  ok: false
  reason: EquipmentChangeFailureReason
}

export type EquipmentChangeResult = EquipmentChangeSuccess | EquipmentChangeFailure

const isEquipmentPosition = (position: EquipmentPosition | undefined): position is EquipmentPosition => Boolean(position && EQUIPMENT_POSITIONS.includes(position))

const getAccessoryTarget = (equipment: GameState['equipment'], targetPosition: EquipmentPosition | undefined, positions: readonly ['ring1', 'ring2'] | readonly ['earring1', 'earring2']): EquipmentPosition | null => {
  if (targetPosition !== undefined) return targetPosition
  if (!equipment[positions[0]]) return positions[0]
  if (!equipment[positions[1]]) return positions[1]
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

  const isRing = item.equipmentSlot === 'ring'
  const isEarring = item.equipmentSlot === 'earring'
  const position = isRing
    ? getAccessoryTarget(state.equipment, targetPosition, ['ring1', 'ring2'])
    : isEarring
      ? getAccessoryTarget(state.equipment, targetPosition, ['earring1', 'earring2'])
      : targetPosition ?? getDefaultEquipmentPosition(item.equipmentSlot)
  if (!position) return { ok: false, reason: isRing ? 'ring-target-required' : 'earring-target-required' }
  if (!isEquipmentPosition(position) || !isPositionCompatible(itemId, position)) return { ok: false, reason: 'incompatible' }
  if (isRing || isEarring) {
    const other = isRing
      ? position === 'ring1' ? 'ring2' : 'ring1'
      : position === 'earring1' ? 'earring2' : 'earring1'
    if (state.equipment[other] === itemId) return { ok: false, reason: isRing ? 'duplicate-ring' : 'duplicate-earring' }
  }

  const replacedSameCopy = state.equipment[position] === itemId ? 1 : 0
  const ownedCopies = Math.max(0, Math.floor(state.inventory[itemId] ?? 0))
  if (countEquipped(state.equipment, itemId) - replacedSameCopy + 1 > ownedCopies) return { ok: false, reason: 'insufficient-copies' }

  const nextEquipment = { ...state.equipment }
  nextEquipment[position] = itemId
  return { ok: true, position, nextEquipment }
}
