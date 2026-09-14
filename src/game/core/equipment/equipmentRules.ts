import { ITEMS } from '../../content/items/items'
import type { EquipmentItemSlot, EquipmentPosition, GameState, ItemId, ItemDefinition } from '../../types'

export const EQUIPMENT_POSITIONS: readonly EquipmentPosition[] = ['weapon', 'armor', 'head', 'cape', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2']
export const EQUIPMENT_ITEM_SLOTS: readonly EquipmentItemSlot[] = ['weapon', 'armor', 'helmet', 'cape', 'amulet', 'earring', 'ring']

export const EQUIPMENT_POSITION_LABELS: Record<EquipmentPosition, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  head: 'Head',
  cape: 'Cape',
  necklace: 'Necklace',
  earring1: 'Earring 1',
  earring2: 'Earring 2',
  ring1: 'Ring 1',
  ring2: 'Ring 2',
}

export const EQUIPMENT_ITEM_SLOT_LABELS: Record<EquipmentItemSlot, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  helmet: 'Head',
  cape: 'Cape',
  amulet: 'Necklace',
  earring: 'Earrings',
  ring: 'Rings',
}

export const EMPTY_EQUIPMENT: Record<EquipmentPosition, null> = {
  weapon: null,
  armor: null,
  head: null,
  cape: null,
  necklace: null,
  earring1: null,
  earring2: null,
  ring1: null,
  ring2: null,
}

export function getItemDefinition(itemOrId: ItemId | ItemDefinition | null | undefined) {
  return typeof itemOrId === 'string' ? ITEMS[itemOrId] : itemOrId ?? null
}

export function isWeapon(itemOrId: ItemId | ItemDefinition | null | undefined) {
  return getItemDefinition(itemOrId)?.equipmentSlot === 'weapon'
}

export function getDefaultEquipmentPosition(slot: EquipmentItemSlot | undefined): EquipmentPosition | undefined {
  if (!slot) return undefined
  if (slot === 'helmet') return 'head'
  if (slot === 'amulet') return 'necklace'
  if (slot === 'earring') return 'earring1'
  if (slot === 'ring') return 'ring1'
  return slot
}

export function getItemPositions(itemOrId: ItemId | ItemDefinition | null | undefined): EquipmentPosition[] {
  const item = getItemDefinition(itemOrId)
  if (!item?.equipmentSlot) return []
  if (item.equipmentSlot === 'ring') return ['ring1', 'ring2']
  if (item.equipmentSlot === 'earring') return ['earring1', 'earring2']
  const position = getDefaultEquipmentPosition(item.equipmentSlot)
  return position ? [position] : []
}

export function isPositionCompatible(itemOrId: ItemId | ItemDefinition | null | undefined, position: EquipmentPosition) {
  const item = getItemDefinition(itemOrId)
  if (!item || item.kind !== 'equipment' || !item.equipmentSlot) return false
  if (item.equipmentSlot === 'ring') return position === 'ring1' || position === 'ring2'
  if (item.equipmentSlot === 'earring') return position === 'earring1' || position === 'earring2'
  return getDefaultEquipmentPosition(item.equipmentSlot) === position
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

  if (normalized.ring1 && normalized.ring1 === normalized.ring2) normalized.ring2 = null
  if (normalized.earring1 && normalized.earring1 === normalized.earring2) normalized.earring2 = null
  return normalized
}
