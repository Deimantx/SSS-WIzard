import { ITEMS } from '../../content/items/items'
import type { EquipmentItemSlot, EquipmentPosition, GameState, ItemId, ItemDefinition } from '../../types'

export const EQUIPMENT_POSITIONS: readonly EquipmentPosition[] = ['weapon', 'armor', 'head']
export const EQUIPMENT_ITEM_SLOTS: readonly EquipmentItemSlot[] = ['weapon', 'armor', 'helmet']
export const EQUIPMENT_POSITION_LABELS: Record<EquipmentPosition, string> = { weapon: 'Weapon', armor: 'Armor', head: 'Head' }
export const EQUIPMENT_ITEM_SLOT_LABELS: Record<EquipmentItemSlot, string> = { weapon: 'Weapon', armor: 'Armor', helmet: 'Head' }
export const EMPTY_EQUIPMENT: Record<EquipmentPosition, null> = { weapon: null, armor: null, head: null }

export function getItemDefinition(itemOrId: ItemId | ItemDefinition | null | undefined) { return typeof itemOrId === 'string' ? ITEMS[itemOrId] : itemOrId ?? null }
export function isWeapon(itemOrId: ItemId | ItemDefinition | null | undefined) { return getItemDefinition(itemOrId)?.equipmentSlot === 'weapon' }
export function getDefaultEquipmentPosition(slot: EquipmentItemSlot | undefined): EquipmentPosition | undefined { return slot === 'helmet' ? 'head' : slot }
export function getItemPositions(itemOrId: ItemId | ItemDefinition | null | undefined): EquipmentPosition[] {
  const position = getDefaultEquipmentPosition(getItemDefinition(itemOrId)?.equipmentSlot)
  return position ? [position] : []
}
export function isPositionCompatible(itemOrId: ItemId | ItemDefinition | null | undefined, position: EquipmentPosition) {
  const item = getItemDefinition(itemOrId)
  return Boolean(item && item.kind === 'equipment' && item.equipmentSlot && getDefaultEquipmentPosition(item.equipmentSlot) === position)
}
export function getEquippedReservedQuantity(state: Pick<GameState, 'equipment'>, itemId: ItemId) { return EQUIPMENT_POSITIONS.reduce((count, position) => count + (state.equipment[position] === itemId ? 1 : 0), 0) }
export function getEquippedPositions(state: Pick<GameState, 'equipment'>, itemId: ItemId) { return EQUIPMENT_POSITIONS.filter((position) => state.equipment[position] === itemId) }
export function getEquipmentPositionForItem(state: Pick<GameState, 'equipment'>, itemId: ItemId) { return EQUIPMENT_POSITIONS.find((position) => state.equipment[position] === itemId) ?? null }
export function getEquippedCount(state: Pick<GameState, 'equipment'>) { return EQUIPMENT_POSITIONS.reduce((count, position) => count + (state.equipment[position] ? 1 : 0), 0) }

export function normalizeEquipmentState(equipment: Partial<Record<EquipmentPosition, ItemId | null>> & Record<string, unknown>, inventory?: Partial<Record<ItemId, number>>): Record<EquipmentPosition, ItemId | null> {
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
  return normalized
}
