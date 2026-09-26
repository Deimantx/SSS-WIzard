import type { ItemId, TransmutationRecipeId, RecipeUnlockCondition, ResonanceType } from '../../types'
export interface TransmutationRecipeDefinition {
  id: TransmutationRecipeId
  kind: 'transmutation'
  name: string
  output: { itemId: ItemId; quantity: number }
  category: 'elemental' | 'material'
  baseDurationMs: number
  arcaneFluxCost: number
  resonanceCost?: Partial<Record<ResonanceType, number>>
  /** @deprecated Compatibility-only authored field. Tower work uses Arcane Flux. */
  manaCost?: number
  ingredients: { itemId: ItemId; quantity: number }[]
  unlock: RecipeUnlockCondition
  description?: string
}

const always: RecipeUnlockCondition = { type: 'always' }
export const TRANSMUTATION_RECIPES: Record<TransmutationRecipeId, TransmutationRecipeDefinition> = {
  'fire-fragment': { id: 'fire-fragment', kind: 'transmutation', name: 'Fire Fragment', output: { itemId: 'fire-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 8000, arcaneFluxCost: 10, resonanceCost: { fire: 5 }, ingredients: [], unlock: always, description: 'Stabilize combat-earned Fire Resonance into a Fire Fragment.' },
  'water-fragment': { id: 'water-fragment', kind: 'transmutation', name: 'Water Fragment', output: { itemId: 'water-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 8000, arcaneFluxCost: 10, resonanceCost: { water: 5 }, ingredients: [], unlock: always, description: 'Stabilize combat-earned Water Resonance into a Water Fragment.' },
  'earth-fragment': { id: 'earth-fragment', kind: 'transmutation', name: 'Earth Fragment', output: { itemId: 'earth-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 8000, arcaneFluxCost: 10, resonanceCost: { earth: 5 }, ingredients: [], unlock: always, description: 'Stabilize combat-earned Earth Resonance into an Earth Fragment.' },
  'air-fragment': { id: 'air-fragment', kind: 'transmutation', name: 'Air Fragment', output: { itemId: 'air-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 8000, arcaneFluxCost: 10, resonanceCost: { air: 5 }, ingredients: [], unlock: always, description: 'Stabilize combat-earned Air Resonance into an Air Fragment.' },
  'prismatic-fragment': { id: 'prismatic-fragment', kind: 'transmutation', name: 'Prismatic Fragment', output: { itemId: 'prismatic-fragment', quantity: 1 }, category: 'material', baseDurationMs: 12000, arcaneFluxCost: 40, resonanceCost: {}, ingredients: [{ itemId: 'fire-fragment', quantity: 2 }, { itemId: 'water-fragment', quantity: 2 }, { itemId: 'earth-fragment', quantity: 2}, { itemId: 'air-fragment', quantity: 2 }, { itemId: 'life-essence', quantity: 10 }], unlock: always, description: 'Harmonize elemental fragments through Life Essence and Arcane Flux.' },
}
export const TRANSMUTATION_RECIPE_ORDER: readonly TransmutationRecipeId[] = ["fire-fragment","water-fragment","earth-fragment","air-fragment","prismatic-fragment"]
