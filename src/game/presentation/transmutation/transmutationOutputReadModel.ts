import { ITEMS } from '../../content/items/items'
import { getEquipmentPreview, type EquipmentPreview } from '../equipment/equipmentReadModel'
import type { EquipmentItemSlot, EquipmentPosition, GameState, ItemId } from '../../types'
import type { RecipeDefinition } from '../../content/recipes/recipes'

export interface TransmutationEquipmentInspection {
  slot: EquipmentItemSlot
  hands: 1 | 2 | null
  presentation: 'shield' | 'focus' | null
}

export interface TransmutationOutputInspection {
  itemId: ItemId
  owned: number
  equipment: TransmutationEquipmentInspection | null
}

export function getTransmutationOutputInspection(state: Pick<GameState, 'inventory' | 'equipment' | 'player' | 'progress' | 'activities'>, recipe: RecipeDefinition): TransmutationOutputInspection {
  const item = ITEMS[recipe.output.itemId]
  return {
    itemId: recipe.output.itemId,
    owned: Math.max(0, Math.floor(state.inventory[recipe.output.itemId] ?? 0)),
    equipment: item.kind === 'equipment' && item.equipmentSlot ? { slot: item.equipmentSlot, hands: item.weaponHands ?? null, presentation: item.equipmentPresentation ?? null } : null,
  }
}

export function getTransmutationEquipmentPreview(state: Pick<GameState, 'inventory' | 'equipment' | 'player' | 'progress' | 'activities'>, itemId: ItemId, targetPosition?: EquipmentPosition): EquipmentPreview {
  const inventory = { ...state.inventory, [itemId]: Math.max(1, Math.floor(state.inventory[itemId] ?? 0)) }
  return getEquipmentPreview({ ...state, inventory }, itemId, targetPosition)
}
