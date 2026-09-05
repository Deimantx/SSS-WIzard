import { ARTIFICING_RECIPES } from '../../content/recipes/artificingRecipes'
import { isRecipeUnlocked, getRecipeUnlockRequirement } from '../../content/recipes/recipeUnlocks'
import { ITEMS } from '../../content/items/items'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { grantItem } from '../inventory/itemAcquisition'
import type { ArtificingRecipeDefinition } from '../../content/recipes/artificingRecipes'
import type { GameState, ArtificingRecipeId } from '../../types'

export type ArtificingCraftResult = { ok: true; itemId: import('../../types').ItemId } | { ok: false; reason: string }
export const canCraftArtificingRecipe = (state: Pick<GameState, 'progress' | 'inventory' | 'protectedItems' | 'equipment' | 'activities'>, recipeId: ArtificingRecipeId) => {
  const recipe = ARTIFICING_RECIPES[recipeId as keyof typeof ARTIFICING_RECIPES]
  return Boolean(recipe && isRecipeUnlocked(state, recipe) && recipe.ingredients.every((ingredient) => getConsumableQuantity(state, ingredient.itemId) >= ingredient.quantity))
}
export const craftArtificingRecipe = (state: GameState, recipeId: ArtificingRecipeId): ArtificingCraftResult => {
  const recipe = ARTIFICING_RECIPES[recipeId as keyof typeof ARTIFICING_RECIPES] as ArtificingRecipeDefinition | undefined
  if (!recipe || ITEMS[recipe.output.itemId]?.kind !== 'equipment') return { ok: false, reason: 'Unknown Artificing recipe.' }
  if (!isRecipeUnlocked(state, recipe)) return { ok: false, reason: getRecipeUnlockRequirement(recipe) ?? 'This recipe is locked.' }
  if (!recipe.ingredients.every((ingredient) => getConsumableQuantity(state, ingredient.itemId) >= ingredient.quantity)) return { ok: false, reason: 'Not enough legal ingredients.' }
  recipe.ingredients.forEach(({ itemId, quantity }) => { state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) - quantity) })
  grantItem(state, recipe.output.itemId, 1)
  return { ok: true, itemId: recipe.output.itemId }
}
