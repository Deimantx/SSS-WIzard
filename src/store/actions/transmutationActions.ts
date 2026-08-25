import { RECIPES } from '../../game/content/recipes/recipes'
import { BALANCE } from '../../game/core/balance/balance'
import { canReserveFocusAction } from './focusActions'
import { pushNotification } from '../../game/engine'
import type { GameState } from '../../game/types'

const isProtected = (state: GameState, itemId: keyof GameState['inventory']) => Boolean(state.protectedItems[itemId]) || Object.values(state.equipment).includes(itemId)

export const toggleTransmutationAction = (state: GameState, recipeId: string) => {
  const activity = state.activities.transmutation
  const recipe = RECIPES[recipeId]
  if (activity.running) { activity.running = false; return }
  if (!state.progress.emberStaffUnlocked) { pushNotification(state, 'Grove Sentinel must be defeated before using Transmutation.', 'warning'); return }
  if (!recipe || !canReserveFocusAction(state, recipe.focusCost)) { pushNotification(state, `Cannot start Transmutation - Requires ${recipe?.focusCost ?? BALANCE.transmutation.focusCost} Focus`, 'warning'); return }
  if (!recipe.ingredients.every((ingredient) => (state.inventory[ingredient.itemId] ?? 0) >= ingredient.quantity && !isProtected(state, ingredient.itemId))) { pushNotification(state, 'Missing or protected recipe ingredients.', 'warning'); return }
  state.activities.transmutation = { running: true, recipeId, progressMs: 0 }
}

