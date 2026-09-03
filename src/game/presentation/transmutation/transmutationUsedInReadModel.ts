import { ITEMS } from '../../content/items/items'
import { getItemUses, type InventoryDestination } from '../../content/items/inventoryMetadata'
import { RECIPES } from '../../content/recipes/recipes'
import { isRecipeUnlocked } from '../../systems/transmutation/transmutationSelectors'
import type { GameState, ItemId } from '../../types'

export interface TransmutationVisibleItemUse extends InventoryDestination {
  locked?: boolean
}

/** Used In data for Transmutation: preserve non-recipe destinations and hide locked recipes unless Dev reveal is active. */
export function getVisibleItemUsesForTransmutation(state: Pick<GameState, 'progress' | 'debug'>, itemId: ItemId): TransmutationVisibleItemUse[] {
  return getItemUses(itemId).flatMap((use) => {
    if (use.destination !== 'tower-transmutation' || !use.recipeId) return [use]
    const recipe = RECIPES[use.recipeId]
    if (!recipe) return []
    const locked = !isRecipeUnlocked(state, recipe)
    if (locked && !state.debug.showLockedTransmutationRecipes) return []
    const outputItem = ITEMS[recipe.output.itemId]
    return [{ ...use, detail: `${use.detail ?? 'Transmutation recipe'} · ${outputItem.kind === 'equipment' ? 'Equipment' : 'Material'}`, ...(locked ? { locked: true } : {}) }]
  })
}
