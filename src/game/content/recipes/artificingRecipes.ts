import type { ItemId, RecipeUnlockCondition, RecipeId } from '../../types'
import { ARTIFICING_RECIPES as authored, ARTIFICING_RECIPE_ORDER as authoredOrder } from './recipes'

export interface ArtificingRecipeDefinition {
  id: RecipeId
  name: string
  output: { itemId: ItemId; quantity: 1 }
  ingredients: { itemId: ItemId; quantity: number }[]
  unlock: RecipeUnlockCondition
  description?: string
}
export const ARTIFICING_RECIPE_ORDER = authoredOrder
export const ARTIFICING_RECIPES = Object.fromEntries(Object.entries(authored).map(([id, recipe]) => [id, { id: recipe.id, name: recipe.name, output: { ...recipe.output, quantity: 1 as const }, ingredients: recipe.ingredients, unlock: recipe.unlock, description: recipe.description }])) as Record<typeof ARTIFICING_RECIPE_ORDER[number], ArtificingRecipeDefinition>
