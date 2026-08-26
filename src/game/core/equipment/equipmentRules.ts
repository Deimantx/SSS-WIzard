import { ITEMS } from '../../content/items/items'
import type { EquipmentItemSlot, EquipmentPosition, GameState, ItemId, ItemDefinition } from '../../types'

export const EQUIPMENT_POSITIONS: readonly EquipmentPosition[] = ['weapon', 'offhand', 'armor', 'helmet', 'amulet', 'earrings', 'ring1', 'ring2']
export const EQUIPMENT_ITEM_SLOTS: readonly EquipmentItemSlot[] = ['weapon', 'offhand', 'armor', 'helmet', 'amulet', 'earrings', 'ring']

export const EQUIPMENT_POSITION_LABELS: Record<EquipmentPosition, string> = {
  weapon: 'Weapon',
  offhand: 'Offhand',
  armor: 'Armor',
  helmet: 'Helmet',
  amulet: 'Amulet',
  earrings: 'Earrings',
  ring1: 'Ring 1',
  ring2: 'Ring 2',
}

export const EQUIPMENT_ITEM_SLOT_LABELS: Record<EquipmentItemSlot, string> = {
  weapon: 'Weapon',
  offhand: 'Offhand',
  armor: 'Armor',
  helmet: 'Helmet',
  amulet: 'Amulet',
  earrings: 'Earrings',
  ring: 'Rings',
}

export const EMPTY_EQUIPMENT: Record<EquipmentPosition, null> = {
  weapon: null,
  offhand: null,
  armor: null,
  helmet: null,
  amulet: null,
  earrings: null,
  ring1: null,
  ring2: null,
}

export function getItemDefinition(itemOrId: ItemId | ItemDefinition | null | undefined) {
  return typeof itemOrId === 'string' ? ITEMS[itemOrId] : itemOrId ?? null
}

export function isTwoHandedWeapon(itemOrId: ItemId | ItemDefinition | null | undefined) {
  const item = getItemDefinition(itemOrId)
  return item?.kind === 'equipment' && item.equipmentSlot === 'weapon' && item.weaponHands === 2
}

export function isWeapon(itemOrId: ItemId | ItemDefinition | null | undefined) {
  return getItemDefinition(itemOrId)?.equipmentSlot === 'weapon'
}

export function getItemPositions(itemOrId: ItemId | ItemDefinition | null | undefined): EquipmentPosition[] {
  const item = getItemDefinition(itemOrId)
  if (!item?.equipmentSlot) return []
  return item.equipmentSlot === 'ring' ? ['ring1', 'ring2'] : [item.equipmentSlot]
}

export function isPositionCompatible(itemOrId: ItemId | ItemDefinition | null | undefined, position: EquipmentPosition) {
  const item = getItemDefinition(itemOrId)
  if (!item || item.kind !== 'equipment' || !item.equipmentSlot) return false
  return item.equipmentSlot === 'ring' ? position === 'ring1' || position === 'ring2' : item.equipmentSlot === position
}

export function getEquippedReservedQuantity(state: Pick<GameState, 'equipment'>, itemId: ItemId) {
  return EQUIPMENT_POSITIONS.reduce((count, position) => count + (state.equipment[position] === itemId ? 1 : 0), 0)
}

export function getEquippedPositions(state: Pick<GameState, 'equipment'>, itemId: ItemId) {
  return EQUIPMENT_POSITIONS.filter((position) => state.equipment[position] === itemId)
}

export function getEquipmentPositionForItem(state: Pick<GameState, 'equipment'>, itemId: ItemId) {
  return EQUIPMENT_POSITIONS.find((position) => state.equipment[position] === itemId) ?? null
}

export function getEquippedCount(state: Pick<GameState, 'equipment'>) {
  return EQUIPMENT_POSITIONS.reduce((count, position) => count + (state.equipment[position] ? 1 : 0), 0)
}

export function normalizeEquipmentState(
  equipment: Partial<Record<EquipmentPosition, ItemId | null>>,
  inventory?: Partial<Record<ItemId, number>>,
): Record<EquipmentPosition, ItemId | null> {
  const normalized: Record<EquipmentPosition, ItemId | null> = { ...EMPTY_EQUIPMENT }
  const used = new Map<ItemId, number>()
  const hasInventory = inventory !== undefined

  for (const position of EQUIPMENT_POSITIONS) {
    const itemId = equipment[position]
    if (!itemId || !ITEMS[itemId] || !isPositionCompatible(itemId, position)) continue
    const quantity = hasInventory ? Math.max(0, Math.floor(inventory[itemId] ?? 0)) : Number.MAX_SAFE_INTEGER
    const nextUsed = (used.get(itemId) ?? 0) + 1
    if (nextUsed > quantity) continue
    normalized[position] = itemId
    used.set(itemId, nextUsed)
  }

  if (isTwoHandedWeapon(normalized.weapon)) normalized.offhand = null
  return normalized
}

export function previewEquipmentState(
  equipment: Record<EquipmentPosition, ItemId | null>,
  itemId: ItemId,
  targetPosition?: EquipmentPosition,
) {
  const item = ITEMS[itemId]
  if (!item || item.kind !== 'equipment' || !item.equipmentSlot) return null
  const position = targetPosition ?? (item.equipmentSlot === 'ring' ? (equipment.ring1 ? (equipment.ring2 ? null : 'ring2') : 'ring1') : item.equipmentSlot)
  if (!position) return null
  if (!isPositionCompatible(itemId, position)) return null
  if (item.equipmentSlot === 'offhand' && isTwoHandedWeapon(equipment.weapon)) return null
  const next = { ...equipment }
  if (isTwoHandedWeapon(itemId)) next.offhand = null
  next[position] = itemId
  return next
}
