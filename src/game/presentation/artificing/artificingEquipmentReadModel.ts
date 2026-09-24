import { ITEMS } from '../../content/items/items'
import { getEquipmentPreview, type EquipmentPreview } from '../equipment/equipmentReadModel'
import { getEffectiveEquipmentItemStats } from '../../core/equipment/equipmentStats'
import { getArtifactDefinition, getArtifactMaxInvestedRanks, getArtifactTotalInvestedRanks, isArtifactItem } from '../../systems/artifacts/artifactProgression'
import type { EquipmentItemSlot, EquipmentPosition, EquipmentStats, GameState, ItemId } from '../../types'
import type { ArtificingRecipeDefinition } from '../../content/recipes/artificingRecipes'

export interface ArtificingEquipmentInspection {
  slot: EquipmentItemSlot
}

export interface ArtificingOutputInspection {
  itemId: ItemId
  owned: number
  equipment: ArtificingEquipmentInspection | null
  stats: EquipmentStats
  artifactRanks: number | null
  artifactMaxRanks: number | null
}

const getForgeArtifactProgress = (state: Pick<GameState, 'inventory' | 'artifactProgress'>, itemId: ItemId, owned: number) => {
  if (!isArtifactItem(itemId) || owned > 0 || !state.artifactProgress[itemId]) return state.artifactProgress
  const artifactProgress = { ...state.artifactProgress }
  delete artifactProgress[itemId]
  return artifactProgress
}

export function getArtificingOutputInspection(state: Pick<GameState, 'inventory' | 'equipment' | 'player' | 'progress' | 'activities' | 'artifactProgress' | 'arcaneCore' | 'crystals'>, recipe: ArtificingRecipeDefinition): ArtificingOutputInspection {
  const item = ITEMS[recipe.output.itemId]
  const artifactId = isArtifactItem(recipe.output.itemId) ? recipe.output.itemId : null
  const owned = Math.max(0, Math.floor(state.inventory[recipe.output.itemId] ?? 0))
  const artifactProgress = getForgeArtifactProgress(state, recipe.output.itemId, owned)
  const effectiveState = { ...state, artifactProgress }
  return {
    itemId: recipe.output.itemId,
    owned,
    equipment: item.kind === 'equipment' && item.equipmentSlot ? { slot: item.equipmentSlot } : null,
    stats: item.kind === 'equipment' ? getEffectiveEquipmentItemStats(effectiveState, recipe.output.itemId) : {},
    artifactRanks: artifactId ? getArtifactTotalInvestedRanks(effectiveState, artifactId) : null,
    artifactMaxRanks: artifactId ? getArtifactMaxInvestedRanks(artifactId) : null,
  }
}

export function getArtificingEquipmentPreview(state: Pick<GameState, 'inventory' | 'equipment' | 'player' | 'progress' | 'activities' | 'artifactProgress' | 'arcaneCore' | 'crystals'>, itemId: ItemId, targetPosition?: EquipmentPosition): EquipmentPreview {
  const owned = Math.max(0, Math.floor(state.inventory[itemId] ?? 0))
  const inventory = { ...state.inventory, [itemId]: Math.max(1, owned) }
  const artifactProgress = getForgeArtifactProgress(state, itemId, owned)
  return getEquipmentPreview({ ...state, inventory, artifactProgress }, itemId, targetPosition)
}
