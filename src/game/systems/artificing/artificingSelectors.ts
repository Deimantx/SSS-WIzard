import { ARTIFICING_RECIPES, ARTIFICING_RECIPE_ORDER, type ArtificingRecipeDefinition } from '../../content/recipes/artificingRecipes'
import { ITEMS } from '../../content/items/items'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { isRecipeUnlocked, getRecipeUnlockRequirement } from '../../content/recipes/recipeUnlocks'
import { canCraftArtificingRecipe } from './artificingEngine'
import type { GameState, EquipmentItemSlot, DungeonId } from '../../types'
export { canCraftArtificingRecipe }
export const getArtificingUnlockReason = getRecipeUnlockRequirement
export interface ArtificingFilters {
  slotFilter: 'all' | EquipmentItemSlot
  weaponHandsFilter: 'all' | 1 | 2
  offhandPresentationFilter: 'all' | 'shield' | 'focus'
  sourceDungeonFilter: 'all' | DungeonId
  craftableOnly: boolean
  ownershipFilter: 'all' | 'owned' | 'unowned'
}
export const DEFAULT_ARTIFICING_FILTERS: ArtificingFilters = { slotFilter: 'all', weaponHandsFilter: 'all', offhandPresentationFilter: 'all', sourceDungeonFilter: 'all', craftableOnly: false, ownershipFilter: 'all' }
export const getArtificingRecipeEntries = () => ARTIFICING_RECIPE_ORDER.map(id => ARTIFICING_RECIPES[id])
export const getArtificingProfile = (recipe: ArtificingRecipeDefinition) => {
  const item = ITEMS[recipe.output.itemId]
  return [item.equipmentSlot?.toUpperCase(), item.weaponHands ? `${item.weaponHands}H` : item.equipmentPresentation?.toUpperCase()].filter(Boolean).join(' · ')
}
export function getVisibleArtificingRecipes(state: GameState, filters: ArtificingFilters = DEFAULT_ARTIFICING_FILTERS, query = '', showLocked = state.debug.showLockedArtificingRecipes) {
  const search = query.trim().toLowerCase()
  return getArtificingRecipeEntries().filter(recipe => {
    const item = ITEMS[recipe.output.itemId]
    if (!showLocked && !isRecipeUnlocked(state, recipe)) return false
    if (filters.slotFilter !== 'all' && item.equipmentSlot !== filters.slotFilter) return false
    if (filters.slotFilter === 'weapon' && filters.weaponHandsFilter !== 'all' && item.weaponHands !== filters.weaponHandsFilter) return false
    if (filters.slotFilter === 'offhand' && filters.offhandPresentationFilter !== 'all' && item.equipmentPresentation !== filters.offhandPresentationFilter) return false
    if (filters.sourceDungeonFilter !== 'all' && recipe.sourceDungeonId !== filters.sourceDungeonFilter) return false
    if (filters.craftableOnly && !canCraftArtificingRecipe(state, recipe.id)) return false
    const owned = (state.inventory[recipe.output.itemId] ?? 0) > 0
    if (filters.ownershipFilter === 'owned' && !owned || filters.ownershipFilter === 'unowned' && owned) return false
    return !search || [recipe.id, recipe.name, item.name, DUNGEONS[recipe.sourceDungeonId].name, item.equipmentSlot].join(' ').toLowerCase().includes(search)
  })
}
export function getArtificingFilterCounts(state: GameState, filters: ArtificingFilters, query = '') {
  return {
    visible: getVisibleArtificingRecipes(state, filters, query).length,
    craftable: getVisibleArtificingRecipes(state, { ...filters, craftableOnly: true }, query).length,
    unlocked: getArtificingRecipeEntries().filter(recipe => isRecipeUnlocked(state, recipe)).length,
  }
}
