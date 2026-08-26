import { RECIPES, RECIPE_ORDER } from '../../content/recipes/recipes'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { pushNotification } from '../../engine'
import type { GameState, ItemId, RecipeId } from '../../types'

export interface TransmutationAdvanceContext {
  mode: 'live' | 'banked'
  suppressRoutineNotifications?: boolean
  report?: { recordTransmutation: (recipeId: RecipeId, output: ItemId, quantity: number, ingredients: { itemId: ItemId; quantity: number }[]) => void }
  onItemAcquired?: (itemId: ItemId, quantity: number) => void
}

const shouldNotify = (context: TransmutationAdvanceContext) => context.mode === 'live' && !context.suppressRoutineNotifications

function canComplete(state: GameState, recipe: (typeof RECIPES)[RecipeId]) {
  return state.player.mana >= recipe.manaCost && recipe.ingredients.every((ingredient) => getConsumableQuantity(state, ingredient.itemId) >= ingredient.quantity)
}

function complete(state: GameState, recipe: (typeof RECIPES)[RecipeId], context: TransmutationAdvanceContext) {
  if (!canComplete(state, recipe)) return false
  if (recipe.manaCost > 0) state.player.mana -= recipe.manaCost
  recipe.ingredients.forEach((ingredient) => { state.inventory[ingredient.itemId] = Math.max(0, (state.inventory[ingredient.itemId] ?? 0) - ingredient.quantity) })
  state.inventory[recipe.output.itemId] = (state.inventory[recipe.output.itemId] ?? 0) + recipe.output.quantity
  context.onItemAcquired?.(recipe.output.itemId, recipe.output.quantity)
  context.report?.recordTransmutation(recipe.id, recipe.output.itemId, recipe.output.quantity, recipe.ingredients)
  if (shouldNotify(context)) pushNotification(state, `${recipe.name} transmuted`, 'success')
  return true
}

/** Advances every assigned recipe in stable authored order. Echoes affect speed only. */
export function advanceTransmutation(state: GameState, deltaMs: number, context: TransmutationAdvanceContext) {
  const delta = Math.max(0, Math.min(1000, deltaMs))
  for (const recipeId of RECIPE_ORDER) {
    const recipe = RECIPES[recipeId]
    const job = state.activities.transmutation.jobs[recipeId]
    const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? 0))
    if (!job || echoes <= 0 || (recipe.unlock.type === 'first-grove-sentinel-kill' && !state.progress.firstBossKill)) continue
    job.echoesAssigned = echoes
    job.progressMs = Math.max(0, Math.min(recipe.baseDurationMs, Number.isFinite(job.progressMs) ? job.progressMs : 0))
    if (job.progressMs < recipe.baseDurationMs) job.progressMs = Math.min(recipe.baseDurationMs, job.progressMs + delta * echoes)
    while (job.progressMs >= recipe.baseDurationMs) {
      if (!complete(state, recipe, context)) {
        job.progressMs = recipe.baseDurationMs
        break
      }
      job.progressMs -= recipe.baseDurationMs
    }
  }
  return state
}

export const forceCompleteTransmutationCycle = (state: GameState, recipeId: RecipeId, context: TransmutationAdvanceContext) => {
  const recipe = RECIPES[recipeId]
  if (!recipe) return false
  const job = state.activities.transmutation.jobs[recipeId] ?? (state.activities.transmutation.jobs[recipeId] = { echoesAssigned: 0, progressMs: 0 })
  job.progressMs = recipe.baseDurationMs
  return complete(state, recipe, context) ? (job.progressMs = 0, true) : false
}
