import { TRANSMUTATION_RECIPES as RECIPES } from '../../game/content/recipes/recipes'
import { BALANCE } from '../../game/core/balance/balance'
import { getConsumableQuantity } from '../../game/core/inventory/inventoryConsumption'
import { canReserveFocusAction } from './focusActions'
import { pushNotification } from '../../game/engine'
import { getRecipeUnlockReason, getTransmutationEchoesAssigned, getTransmutationEchoCapacity, isRecipeUnlocked } from '../../game/systems/transmutation/transmutationSelectors'
import { grantItem } from '../../game/systems/inventory/itemAcquisition'
import type { GameState, RecipeId } from '../../game/types'

const ensureJob = (state: GameState, recipeId: RecipeId) => state.activities.transmutation.jobs[recipeId] ?? (state.activities.transmutation.jobs[recipeId] = { echoesAssigned: 0, progressMs: 0 })

export const assignTransmutationEchoAction = (state: GameState, recipeId: RecipeId) => {
  const recipe = RECIPES[recipeId]
  if (!recipe || !isRecipeUnlocked(state, recipe)) { pushNotification(state, recipe ? getRecipeUnlockReason(recipe) ?? 'This recipe is locked.' : 'Unknown Transmutation recipe.', 'warning', { key: 'transmutation-locked', cooldownMs: 1500 }); return false }
  if (getTransmutationEchoesAssigned(state) >= getTransmutationEchoCapacity(state)) { const capacity = getTransmutationEchoCapacity(state); pushNotification(state, `Transmutation Echo capacity reached: ${capacity} / ${capacity}.`, 'warning', { key: 'transmutation-capacity', cooldownMs: 1500 }); return false }
  if (!canReserveFocusAction(state, BALANCE.transmutation.echoFocusCost)) { pushNotification(state, `Not enough free Focus. Each Transmutation Echo requires ${BALANCE.transmutation.echoFocusCost} Focus.`, 'warning', { key: 'transmutation-no-focus', cooldownMs: 1500 }); return false }
  ensureJob(state, recipeId).echoesAssigned += 1
  return true
}

export const removeTransmutationEchoAction = (state: GameState, recipeId: RecipeId) => {
  const job = state.activities.transmutation.jobs[recipeId]
  if (job) job.echoesAssigned = Math.max(0, Math.floor(job.echoesAssigned) - 1)
  return true
}

export const setTransmutationEchoesAction = (state: GameState, recipeId: RecipeId, amount: number, force = false) => {
  const recipe = RECIPES[recipeId]
  if (!recipe) return false
  const target = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0))
  const current = Math.max(0, Math.floor(state.activities.transmutation.jobs[recipeId]?.echoesAssigned ?? 0))
  if (target <= current || force) {
    const job = ensureJob(state, recipeId)
    job.echoesAssigned = force && state.debug.ignoreEchoLimit ? target : Math.min(target, current + getTransmutationAssignableEchoes(state, recipeId))
    return true
  }
  for (let index = current; index < target; index += 1) if (!assignTransmutationEchoAction(state, recipeId)) break
  return true
}

const getTransmutationAssignableEchoes = (state: GameState, recipeId: RecipeId) => {
  const current = Math.max(0, Math.floor(state.activities.transmutation.jobs[recipeId]?.echoesAssigned ?? 0))
  return Math.max(0, getTransmutationEchoCapacity(state) - getTransmutationEchoesAssigned(state) + current)
}

export const clearTransmutationAssignmentsAction = (state: GameState) => Object.values(state.activities.transmutation.jobs).forEach((job) => { if (job) job.echoesAssigned = 0 })
export const setTransmutationEchoCapacityOverrideAction = (state: GameState, amount: number | null) => { state.debug.transmutationEchoCapacityOverride = amount === null || !Number.isFinite(amount) ? null : Math.max(0, Math.floor(amount)) }

/** Grants only the missing consumable ingredients for one or more test cycles. */
export const grantTransmutationMissingIngredientsAction = (state: GameState, recipeId: RecipeId, cycles = 1) => {
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
