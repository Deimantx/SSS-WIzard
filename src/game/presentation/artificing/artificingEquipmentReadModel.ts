import { ITEMS } from '../../content/items/items'
import { getEquipmentPreview, type EquipmentPreview } from '../equipment/equipmentReadModel'
import type { EquipmentItemSlot, EquipmentPosition, GameState, ItemId } from '../../types'
import type { ArtificingRecipeDefinition } from '../../content/recipes/artificingRecipes'

export interface ArtificingEquipmentInspection {
  slot: EquipmentItemSlot
}

export interface ArtificingOutputInspection {
  itemId: ItemId
  owned: number
  equipment: ArtificingEquipmentInspection | null
}

export function getArtificingOutputInspection(state: Pick<GameState, 'inventory' | 'equipment' | 'player' | 'progress' | 'activities'>, recipe: ArtificingRecipeDefinition): ArtificingOutputInspection {
  const item = ITEMS[recipe.output.itemId]
  return {
    itemId: recipe.output.itemId,
    owned: Math.max(0, Math.floor(state.inventory[recipe.output.itemId] ?? 0)),
    equipment: item.kind === 'equipment' && item.equipmentSlot ? { slot: item.equipmentSlot } : null,
  }
}

export function getArtificingEquipmentPreview(state: Pick<GameState, 'inventory' | 'equipment' | 'player' | 'progress' | 'activities'>, itemId: ItemId, targetPosition?: EquipmentPosition): EquipmentPreview {
  const inventory = { ...state.inventory, [itemId]: Math.max(1, Math.floor(state.inventory[itemId] ?? 0)) }
  return getEquipmentPreview({ ...state, inventory }, itemId, targetPosition)
}
