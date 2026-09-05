import { ARTIFICING_RECIPES } from '../../content/recipes/artificingRecipes'
import { isRecipeUnlocked, getRecipeUnlockRequirement } from '../../content/recipes/recipeUnlocks'
import { ITEMS } from '../../content/items/items'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { grantItem } from '../inventory/itemAcquisition'
import type { ArtificingRecipeDefinition } from '../../content/recipes/artificingRecipes'
import type { GameState, ArtificingRecipeId, ItemId } from '../../types'

export type ArtificingCraftResult = { ok: true; itemId: ItemId } | { ok: false; reason: string }

const getRecipe = (recipeId: ArtificingRecipeId) => ARTIFICING_RECIPES[recipeId as keyof typeof ARTIFICING_RECIPES] as ArtificingRecipeDefinition | undefined

export const canCraftArtificingRecipe = (state: Pick<GameState, 'progress' | 'inventory' | 'protectedItems' | 'equipment' | 'activities'>, recipeId: ArtificingRecipeId) => {
  const recipe = getRecipe(recipeId)
  return Boolean(recipe && !state.activities.artificing.activeRecipeId && isRecipeUnlocked(state, recipe) && recipe.ingredients.every((ingredient) => getConsumableQuantity(state, ingredient.itemId) >= ingredient.quantity))
}

export const startArtificingCraft = (state: GameState, recipeId: ArtificingRecipeId): ArtificingCraftResult => {
  const recipe = getRecipe(recipeId)
  if (!recipe || ITEMS[recipe.output.itemId]?.kind !== 'equipment') return { ok: false, reason: 'Unknown Artificing recipe.' }
  if (state.activities.artificing.activeRecipeId) return { ok: false, reason: 'Another Equipment craft is already in progress.' }
  if (!isRecipeUnlocked(state, recipe)) return { ok: false, reason: getRecipeUnlockRequirement(recipe) ?? 'This recipe is locked.' }
  if (!recipe.ingredients.every((ingredient) => getConsumableQuantity(state, ingredient.itemId) >= ingredient.quantity)) return { ok: false, reason: 'Not enough legal ingredients.' }
  recipe.ingredients.forEach(({ itemId, quantity }) => { state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) - quantity) })
  state.activities.artificing = { activeRecipeId: recipe.id, progressMs: 0 }
  return { ok: true, itemId: recipe.output.itemId }
}

export const completeArtificingCraft = (state: GameState): ArtificingCraftResult | null => {
  const activeId = state.activities.artificing.activeRecipeId
  if (!activeId) return null
  const recipe = getRecipe(activeId)
  state.activities.artificing = { activeRecipeId: null, progressMs: 0 }
  if (!recipe) return null
  grantItem(state, recipe.output.itemId, 1)
  return { ok: true, itemId: recipe.output.itemId }
}

export const advanceArtificing = (state: GameState, deltaMs: number, onComplete?: (itemId: ItemId) => void) => {
  const activeId = state.activities.artificing.activeRecipeId
  if (!activeId || deltaMs <= 0) return null
  const recipe = getRecipe(activeId)
  if (!recipe) { state.activities.artificing = { activeRecipeId: null, progressMs: 0 }; return null }
  state.activities.artificing.progressMs = Math.min(recipe.baseDurationMs, Math.max(0, state.activities.artificing.progressMs + deltaMs))
  if (state.activities.artificing.progressMs < recipe.baseDurationMs) return null
  const result = completeArtificingCraft(state)
  if (result?.ok) onComplete?.(result.itemId)
  return result
}

/** Compatibility name for callers; normal Artificing now starts a timed craft. */
export const craftArtificingRecipe = startArtificingCraft
