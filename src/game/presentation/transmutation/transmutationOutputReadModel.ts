import { getItemSourceLabel, getResearchXp, ITEMS } from '../../content/items/items'
import { getItemUses, getInventorySubcategoryLabel } from '../../content/items/inventoryMetadata'
import { SCHOOLS } from '../../content/schools/schools'
import { getEquipmentPreview, type EquipmentPreview } from '../equipment/equipmentReadModel'
import type { EquipmentItemSlot, EquipmentPosition, GameState, ItemId, SchoolId } from '../../types'
import type { RecipeDefinition } from '../../content/recipes/recipes'

export interface TransmutationMaterialInspection {
  tier: number | null
  subtype: string | null
  source: string
  usedIn: ReturnType<typeof getItemUses>
  research: Array<{ schoolId: SchoolId; xp: number }>
}

export interface TransmutationEquipmentInspection {
  slot: EquipmentItemSlot
  hands: 1 | 2 | null
  presentation: 'shield' | 'focus' | null
}

export interface TransmutationOutputInspection {
  itemId: ItemId
  owned: number
  material: TransmutationMaterialInspection | null
  equipment: TransmutationEquipmentInspection | null
}

export function getTransmutationOutputInspection(state: Pick<GameState, 'inventory' | 'equipment' | 'player' | 'progress' | 'activities'>, recipe: RecipeDefinition): TransmutationOutputInspection {
  const item = ITEMS[recipe.output.itemId]
  const research = item.researchSchool ? (Object.keys(SCHOOLS) as SchoolId[]).map((schoolId) => ({ schoolId, xp: getResearchXp(recipe.output.itemId, schoolId) })) : []
  return {
    itemId: recipe.output.itemId,
    owned: Math.max(0, Math.floor(state.inventory[recipe.output.itemId] ?? 0)),
    material: item.kind === 'material' ? { tier: item.materialTier ?? null, subtype: getInventorySubcategoryLabel(recipe.output.itemId) ?? item.materialSubtype ?? null, source: getItemSourceLabel(recipe.output.itemId), usedIn: getItemUses(recipe.output.itemId), research } : null,
    equipment: item.kind === 'equipment' && item.equipmentSlot ? { slot: item.equipmentSlot, hands: item.weaponHands ?? null, presentation: item.equipmentPresentation ?? null } : null,
  }
}

export function getTransmutationEquipmentPreview(state: Pick<GameState, 'inventory' | 'equipment' | 'player' | 'progress' | 'activities'>, itemId: ItemId, targetPosition?: EquipmentPosition): EquipmentPreview {
  const inventory = { ...state.inventory, [itemId]: Math.max(1, Math.floor(state.inventory[itemId] ?? 0)) }
  return getEquipmentPreview({ ...state, inventory }, itemId, targetPosition)
}
