import type { ItemId, TransmutationRecipeId, RecipeUnlockCondition } from '../../types'
export interface TransmutationRecipeDefinition {
  id: TransmutationRecipeId
  name: string
  output: { itemId: ItemId; quantity: number }
  category: 'elemental' | 'material'
  baseDurationMs: number
  manaCost: number
  ingredients: { itemId: ItemId; quantity: number }[]
  unlock: RecipeUnlockCondition
  description?: string
}

const always: RecipeUnlockCondition = { type: 'always' }
export const TRANSMUTATION_RECIPES: Record<TransmutationRecipeId, TransmutationRecipeDefinition> = {
  'fire-fragment': { id: 'fire-fragment', name: 'Fire Fragment', output: { itemId: 'fire-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 8000, manaCost: 25, ingredients: [], unlock: always, description: 'Shape Mana into a stable Fire Fragment.' },
  'water-fragment': { id: 'water-fragment', name: 'Water Fragment', output: { itemId: 'water-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 8000, manaCost: 25, ingredients: [], unlock: always, description: 'Shape Mana into a stable Water Fragment.' },
  'earth-fragment': { id: 'earth-fragment', name: 'Earth Fragment', output: { itemId: 'earth-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 8000, manaCost: 25, ingredients: [], unlock: always, description: 'Shape Mana into a stable Earth Fragment.' },
  'air-fragment': { id: 'air-fragment', name: 'Air Fragment', output: { itemId: 'air-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 8000, manaCost: 25, ingredients: [], unlock: always, description: 'Shape Mana into a stable Air Fragment.' },
  'prismatic-fragment': { id: 'prismatic-fragment', name: 'Prismatic Fragment', output: { itemId: 'prismatic-fragment', quantity: 1 }, category: 'material', baseDurationMs: 24000, manaCost: 50, ingredients: [{ itemId: 'fire-fragment', quantity: 2 }, { itemId: 'water-fragment', quantity: 2 }, { itemId: 'earth-fragment', quantity: 2 }, { itemId: 'air-fragment', quantity: 2 }, { itemId: 'life-essence', quantity: 10 }], unlock: always, description: 'Harmonize all four elemental forces through Life Essence.' },
}
export const TRANSMUTATION_RECIPE_ORDER: readonly TransmutationRecipeId[] = ["fire-fragment","water-fragment","earth-fragment","air-fragment","prismatic-fragment"]
