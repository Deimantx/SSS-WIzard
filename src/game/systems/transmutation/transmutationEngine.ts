import { RECIPES, RECIPE_ORDER } from '../../content/recipes/recipes'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import type { GameState, ItemId, RecipeId } from '../../types'
import { allocateContinuousMana, CONTINUOUS_MANA_EPSILON, requestedManaForProgress, type ContinuousManaAllocation, type ContinuousManaFundingResult, type ContinuousManaWorkRequest } from '../simulation/continuousManaScheduler'

export interface TransmutationAdvanceContext {
  mode: 'live' | 'banked'
  report?: { recordTransmutation: (recipeId: RecipeId, output: ItemId, quantity: number, ingredients: { itemId: ItemId; quantity: number }[]) => void }
  onItemAcquired?: (itemId: ItemId, quantity: number) => void
}

const finiteNonNegative = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
const finiteEchoes = (value: unknown) => Math.max(0, Math.floor(finiteNonNegative(value)))
const isUnlocked = (state: GameState, recipe: (typeof RECIPES)[RecipeId]) => recipe.unlock.type === 'always' || state.progress.firstBossKill
const requestKey = (recipeId: RecipeId) => `transmutation-${recipeId}`

const getAvailableCrafts = (state: GameState, recipe: (typeof RECIPES)[RecipeId]) => {
  if (recipe.ingredients.length === 0) return Number.POSITIVE_INFINITY
  return Math.min(...recipe.ingredients.map((ingredient) => Math.floor(getConsumableQuantity(state, ingredient.itemId) / Math.max(1, ingredient.quantity))))
}

const normalizeProgress = (job: { progressMs: number }, durationMs: number) => {
  const progress = finiteNonNegative(job.progressMs)
  // A full progress value is an old completion-burst save state. It was not
  // fully Mana-funded, so never let it turn into a free completion.
  if (progress >= durationMs) {
    job.progressMs = 0
    return 0
  }
  job.progressMs = Math.min(durationMs, progress)
  return job.progressMs
}

const hasMaterialsForCycle = (state: GameState, recipe: (typeof RECIPES)[RecipeId]) => recipe.ingredients.every((ingredient) => getConsumableQuantity(state, ingredient.itemId) >= ingredient.quantity)

/** Builds all eligible Transmutation demand before any continuous work mutates inventory. */
export const buildTransmutationWorkRequests = (state: GameState, deltaMs: number): ContinuousManaWorkRequest[] => {
  const delta = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0
  const requests: ContinuousManaWorkRequest[] = []

  for (const recipeId of RECIPE_ORDER) {
    const recipe = RECIPES[recipeId]
    const job = state.activities.transmutation.jobs[recipeId]
    const echoes = finiteEchoes(job?.echoesAssigned)
    if (!job || echoes <= 0 || !isUnlocked(state, recipe)) continue
    job.echoesAssigned = echoes
    const progress = normalizeProgress(job, recipe.baseDurationMs)
    const availableCrafts = getAvailableCrafts(state, recipe)
    if (availableCrafts <= 0) continue
    const workCapacity = Number.isFinite(availableCrafts)
      ? Math.max(0, availableCrafts * recipe.baseDurationMs - progress)
      : Number.POSITIVE_INFINITY
    const requestedProgressMs = Math.min(delta * echoes, workCapacity)
    if (requestedProgressMs <= CONTINUOUS_MANA_EPSILON) continue
    requests.push({
      key: requestKey(recipeId),
      system: 'transmutation',
      sourceId: recipeId,
      requestedProgressMs,
      manaPerCycle: recipe.manaCost,
      cycleDurationMs: recipe.baseDurationMs,
      requestedMana: requestedManaForProgress(recipe.manaCost, requestedProgressMs, recipe.baseDurationMs),
    })
  }
  return requests
}

/** Applies only work that the shared scheduler funded for this tick. */
export const applyTransmutationAllocations = (state: GameState, _requests: readonly ContinuousManaWorkRequest[], allocations: Record<string, ContinuousManaAllocation>, context: TransmutationAdvanceContext) => {
  for (const recipeId of RECIPE_ORDER) {
    const recipe = RECIPES[recipeId]
    const job = state.activities.transmutation.jobs[recipeId]
    const echoes = finiteEchoes(job?.echoesAssigned)
    if (!job || echoes <= 0 || !isUnlocked(state, recipe)) continue
    const allocation = allocations[requestKey(recipeId)]
    const fundedProgressMs = allocation?.fundedProgressMs ?? 0
    const before = normalizeProgress(job, recipe.baseDurationMs)

    if (fundedProgressMs > CONTINUOUS_MANA_EPSILON) job.progressMs = before + fundedProgressMs
    while (job.progressMs >= recipe.baseDurationMs - CONTINUOUS_MANA_EPSILON) {
      if (!hasMaterialsForCycle(state, recipe)) {
        // Eligibility is planned from a pre-work snapshot. If an external
        // mutation invalidated it, retain only honest partial work.
        job.progressMs = Math.min(recipe.baseDurationMs - CONTINUOUS_MANA_EPSILON, Math.max(0, job.progressMs))
        break
      }
      if (!completeTransmutationCycle(state, recipe, context)) break
      job.progressMs = Math.max(0, job.progressMs - recipe.baseDurationMs)
    }
    job.progressMs = Math.min(recipe.baseDurationMs - CONTINUOUS_MANA_EPSILON, Math.max(0, job.progressMs))

    // The selector derives ACTIVE/MANA LIMITED/WAITING MANA from current
    // eligibility, Mana production, and the assigned Echoes.
  }
  return state
}

/** Advances assigned recipes in stable output order after shared funding is planned. */
export function advanceTransmutation(state: GameState, deltaMs: number, context: TransmutationAdvanceContext = { mode: 'live' }, funding?: ContinuousManaFundingResult) {
  const requests = buildTransmutationWorkRequests(state, deltaMs)
  const result = funding ?? allocateContinuousMana(state, requests)
  applyTransmutationAllocations(state, requests, result.allocations, context)
  return state
}

/** DEBUG ONLY: bypasses normal Mana timing to finish one cycle for test setup. */
export const forceCompleteTransmutationCycle = (state: GameState, recipeId: RecipeId, context: TransmutationAdvanceContext) => {
  const recipe = RECIPES[recipeId]
  if (!recipe) return false
  const job = state.activities.transmutation.jobs[recipeId] ?? (state.activities.transmutation.jobs[recipeId] = { echoesAssigned: 0, progressMs: 0 })
  if (!hasMaterialsForCycle(state, recipe)) {
    job.progressMs = 0
    return false
  }
  job.progressMs = 0
  return completeTransmutationCycle(state, recipe, context)
}

/** Completion consumes discrete ingredients and creates output; Mana was paid while work progressed. */
export const completeTransmutationCycle = (state: GameState, recipe: (typeof RECIPES)[RecipeId], context: TransmutationAdvanceContext) => {
  if (!hasMaterialsForCycle(state, recipe)) return false
  recipe.ingredients.forEach((ingredient) => {
    state.inventory[ingredient.itemId] = Math.max(0, (state.inventory[ingredient.itemId] ?? 0) - ingredient.quantity)
  })
  state.inventory[recipe.output.itemId] = (state.inventory[recipe.output.itemId] ?? 0) + recipe.output.quantity
  context.onItemAcquired?.(recipe.output.itemId, recipe.output.quantity)
  context.report?.recordTransmutation(recipe.id, recipe.output.itemId, recipe.output.quantity, recipe.ingredients)
  return true
}
