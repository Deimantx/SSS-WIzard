import { ITEMS } from '../items/items'
import { DUNGEONS } from '../dungeons/dungeons'
import { MONSTERS } from '../monsters'
import type { RecipeId, TransmutationRecipeId } from '../../types'
import { TRANSMUTATION_RECIPES, TRANSMUTATION_RECIPE_ORDER, type TransmutationRecipeDefinition } from './transmutationRecipes'
import { ARTIFICING_RECIPES, ARTIFICING_RECIPE_ORDER, type ArtificingRecipeDefinition } from './artificingRecipes'
export * from './transmutationRecipes'
export * from './artificingRecipes'
export * from './recipeUnlocks'
export type RecipeDefinition = TransmutationRecipeDefinition
export type CraftingRecipeDefinition = TransmutationRecipeDefinition | ArtificingRecipeDefinition
/** Aggregate for relationships and validation; engines use domain registries. */
export const RECIPES = { ...TRANSMUTATION_RECIPES, ...ARTIFICING_RECIPES }
export const RECIPE_ORDER: readonly RecipeId[] = [...TRANSMUTATION_RECIPE_ORDER, ...ARTIFICING_RECIPE_ORDER]
export const isTransmutationRecipeId = (id: string): id is TransmutationRecipeId => Object.prototype.hasOwnProperty.call(TRANSMUTATION_RECIPES, id)
export const validateRecipeDefinitions = (recipes: Record<string, CraftingRecipeDefinition> = RECIPES, order: readonly string[] = RECIPE_ORDER) => {
  const errors: string[] = []
  const ids = Object.values(recipes).map((recipe) => recipe.id)
  if (new Set(ids).size !== ids.length) errors.push('duplicate recipe id')
  Object.entries(recipes).forEach(([key, recipe]) => {
    if (key !== recipe.id) errors.push(`${key}: key/id mismatch`)
    if (!ITEMS[recipe.output.itemId]) errors.push(`${recipe.id}: unknown output item ${recipe.output.itemId}`)
    if (!Number.isInteger(recipe.output.quantity) || recipe.output.quantity < 1) errors.push(`${recipe.id}: output quantity must be positive`)
    if ('baseDurationMs' in recipe && (!Number.isFinite(recipe.baseDurationMs) || recipe.baseDurationMs <= 0 || !Number.isFinite(recipe.manaCost) || recipe.manaCost < 0)) errors.push(`${recipe.id}: invalid duration or Mana cost`)
    if ('sourceDungeonId' in recipe) {
      if (!DUNGEONS[recipe.sourceDungeonId]) errors.push(`${recipe.id}: unknown Artificing source dungeon`)
      if (ITEMS[recipe.output.itemId]?.kind !== 'equipment') errors.push(`${recipe.id}: Artificing output must be Equipment`)
    } else if (ITEMS[recipe.output.itemId]?.kind !== 'material') errors.push(`${recipe.id}: Transmutation output must be material`)
    recipe.ingredients.forEach((ingredient) => { if (!ITEMS[ingredient.itemId]) errors.push(`${recipe.id}: unknown ingredient ${ingredient.itemId}`); if (!Number.isInteger(ingredient.quantity) || ingredient.quantity <= 0) errors.push(`${recipe.id}: invalid ingredient quantity`) })
    if (ITEMS[recipe.output.itemId]?.kind === 'equipment' && recipe.output.quantity !== 1) errors.push(`${recipe.id}: Equipment recipe output quantity must be 1`)
    if (recipe.unlock.type === 'boss-kill' && !MONSTERS[recipe.unlock.bossId]) errors.push(`${recipe.id}: unlock boss must be a known monster`)
    if (recipe.unlock.type === 'monster-kill' && !MONSTERS[recipe.unlock.monsterId]) errors.push(`${recipe.id}: unlock monster must be known`)
    if (recipe.unlock.type === 'dungeon-monster-kills' && !DUNGEONS[recipe.unlock.dungeonId]) errors.push(`${recipe.id}: unlock dungeon must be known`)
    if (recipe.unlock.type === 'dungeon-unlocked' && !DUNGEONS[recipe.unlock.dungeonId]) errors.push(`${recipe.id}: unlock dungeon must be known`)
  })
  if (new Set(order).size !== order.length) errors.push('RECIPE_ORDER contains duplicates')
  if (order.length !== Object.keys(recipes).length || order.some((id) => !recipes[id as RecipeId])) errors.push('RECIPE_ORDER must contain every recipe exactly once')
  Object.entries(ITEMS).filter(([, item]) => item.kind === 'equipment').forEach(([itemId]) => {
    const outputRecipes = Object.values(recipes).filter((recipe) => recipe.output.itemId === itemId)
    if (outputRecipes.length !== 1) errors.push(`${itemId}: Equipment must have exactly one Artificing recipe (found ${outputRecipes.length})`)
  })
  if (errors.length && import.meta.env.DEV) console.error(`[recipes] ${errors.join('; ')}`)
  return errors
}
