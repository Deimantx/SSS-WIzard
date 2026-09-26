import { TRANSMUTATION_RECIPES as RECIPES } from '../../game/content/recipes/recipes'
import { ITEMS } from '../../game/content/items/items'
import { getConsumableQuantity } from '../../game/core/inventory/inventoryConsumption'
import { pushNotification } from '../../game/engine'
import { isRecipeUnlocked } from '../../game/systems/transmutation/transmutationSelectors'
import { grantItem } from '../../game/systems/inventory/itemAcquisition'
import { TRANSMUTATION_ARRAYS, getTransmutationArrayLevelCost, getTransmutationArrayFragmentItemId } from '../../game/content/transmutation/transmutationArrays'
import type { GameState, TransmutationArrayId, TransmutationRecipeId } from '../../game/types'
import { clamp } from '../../game/utils'
import { assignTransmutationAcolyteAction as assignTransmutationAcolyteRuntimeAction, removeTransmutationAcolyteAction as removeTransmutationAcolyteRuntimeAction, clearTransmutationAcolytesAction as clearTransmutationAcolytesRuntimeAction } from './acolyteActions'

export const assignTransmutationAcolyteAction = (state: GameState, recipeId: TransmutationRecipeId) => assignTransmutationAcolyteRuntimeAction(state, recipeId)
export const removeTransmutationAcolyteAction = (state: GameState, recipeId: TransmutationRecipeId) => removeTransmutationAcolyteRuntimeAction(state, recipeId)
export const clearTransmutationAcolytesAction = (state: GameState) => clearTransmutationAcolytesRuntimeAction(state)

export const assignMaxTransmutationAcolytesAction = (state: GameState, recipeId: TransmutationRecipeId) => {
  return assignTransmutationAcolyteRuntimeAction(state, recipeId)
}

export const clearTransmutationRecipeAcolytesAction = (state: GameState, recipeId: TransmutationRecipeId) => {
  const job = state.activities.transmutation.jobs[recipeId]
  if (job) job.acolyteAssigned = false
}

export const setTransmutationAcolytesAction = (state: GameState, recipeId: TransmutationRecipeId, amount: number, force = false) => {
  if (!RECIPES[recipeId]) return false
  if (amount > 0) return assignTransmutationAcolyteRuntimeAction(state, recipeId)
  return removeTransmutationAcolyteRuntimeAction(state, recipeId)
}

export const clearTransmutationAssignmentsAction = (state: GameState) => clearTransmutationAcolytesRuntimeAction(state)
/** Grants only the missing consumable ingredients for one or more test cycles. */
export const grantTransmutationMissingIngredientsAction = (state: GameState, recipeId: TransmutationRecipeId, cycles = 1) => {
  const recipe = RECIPES[recipeId]
  if (!recipe) return false
  const multiplier = Math.max(1, Math.floor(Number.isFinite(cycles) ? cycles : 1))
  recipe.ingredients.forEach((ingredient) => {
    const required = ingredient.quantity * multiplier
    const missing = Math.max(0, required - getConsumableQuantity(state, ingredient.itemId))
    if (missing > 0) grantItem(state, ingredient.itemId, missing)
  })
  return true
}

export const upgradeTransmutationArrayAction = (state: GameState, arrayId: TransmutationArrayId) => {
  const definition = TRANSMUTATION_ARRAYS[arrayId]
  const array = state.progress.transmutation.arrays[arrayId]
  if (!definition || !array) return false
  const nextLevel = Math.floor(array.level) + 1
  if (nextLevel > definition.maxLevel) { pushNotification(state, `${definition.name} is already mastered`, 'warning'); return false }
  const cost = getTransmutationArrayLevelCost(arrayId, nextLevel)
  if (!cost) return false
  const requirements = [...(['fire', 'water', 'earth', 'air'] as const).map((element) => ({ itemId: getTransmutationArrayFragmentItemId(element), quantity: cost.fragments[element] })), { itemId: 'life-essence' as const, quantity: cost.lifeEssence }]
  const blocked = requirements.find(({ itemId }) => Boolean(state.protectedItems[itemId]))
  if (blocked) { pushNotification(state, `Upgrade blocked. ${ITEMS[blocked.itemId].name} is protected.`, 'warning'); return false }
  const missing = requirements.find(({ itemId, quantity }) => getConsumableQuantity(state, itemId) < quantity)
  if (missing) { pushNotification(state, `Not enough ${ITEMS[missing.itemId].name}. Need ${missing.quantity}.`, 'warning'); return false }
  requirements.forEach(({ itemId, quantity }) => { state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) - quantity) })
  array.rank = 1
  array.level = nextLevel
  pushNotification(state, nextLevel === definition.maxLevel ? `${definition.name} mastered Rank I` : `${definition.name} reached Level ${nextLevel}`, 'success')
  return true
}

export const forceSetTransmutationArrayLevelAction = (state: GameState, arrayId: TransmutationArrayId, level: number) => {
  const array = state.progress.transmutation.arrays[arrayId]
  const definition = TRANSMUTATION_ARRAYS[arrayId]
  if (!array || !definition) return false
  array.rank = 1
  array.level = clamp(Math.round(Number.isFinite(level) ? level : 0), 0, definition.maxLevel)
  return true
}
