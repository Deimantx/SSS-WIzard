import { TRANSMUTATION_RECIPES as RECIPES, TRANSMUTATION_RECIPE_ORDER as RECIPE_ORDER } from '../../content/recipes/recipes'
import { isRecipeUnlocked } from './transmutationSelectors'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import type { GameState, ItemId, TransmutationRecipeId } from '../../types'
import { grantItem } from '../inventory/itemAcquisition'
import { allocateTowerFlux, requestedFluxForProgress, TOWER_FLUX_EPSILON, type TowerFluxAllocation, type TowerFluxFundingResult, type TowerFluxWorkRequest } from '../simulation/towerFluxScheduler'
import { getEffectiveTransmutationFluxCost, getEffectiveTransmutationResonanceCost, getEffectiveTransmutationStaffedWorkMultiplier, getTransmutationArrayBonuses } from './transmutationArrays'
import { canSpendResonanceBundle, spendResonanceBundle } from '../resonance/resonanceRuntime'

export interface TransmutationAdvanceContext {
  mode: 'live' | 'banked'
  report?: { recordTransmutation: (recipeId: TransmutationRecipeId, output: ItemId, quantity: number, ingredients: { itemId: ItemId; quantity: number }[]) => void }
  onItemAcquired?: (itemId: ItemId, quantity: number) => void
  random?: () => number
  onTransmutationComplete?: (recipeId: TransmutationRecipeId) => void
}

const finiteNonNegative = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
const isUnlocked = isRecipeUnlocked
const requestKey = (recipeId: TransmutationRecipeId) => `transmutation-${recipeId}`

const getAvailableCrafts = (state: GameState, recipe: (typeof RECIPES)[TransmutationRecipeId]) => {
  const ingredientCycles = recipe.ingredients.length === 0 ? Number.POSITIVE_INFINITY : Math.min(...recipe.ingredients.map((ingredient) => Math.floor(getConsumableQuantity(state, ingredient.itemId) / Math.max(1, ingredient.quantity))))
  const resonance = Object.entries(getEffectiveTransmutationResonanceCost(state, recipe)).map(([type, amount]) => Math.floor((state.resonance[type as keyof typeof state.resonance] ?? 0) / Math.max(1, amount ?? 0)))
  return Math.min(ingredientCycles, resonance.length ? Math.min(...resonance) : Number.POSITIVE_INFINITY)
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

const hasMaterialsForCycle = (state: GameState, recipe: (typeof RECIPES)[TransmutationRecipeId]) => recipe.ingredients.every((ingredient) => getConsumableQuantity(state, ingredient.itemId) >= ingredient.quantity) && canSpendResonanceBundle(state.resonance, getEffectiveTransmutationResonanceCost(state, recipe))

/** Builds all eligible Transmutation demand before any continuous work mutates inventory. */
export const buildTransmutationWorkRequests = (state: GameState, deltaMs: number): TowerFluxWorkRequest[] => {
  const delta = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0
  const requests: TowerFluxWorkRequest[] = []

  for (const recipeId of RECIPE_ORDER) {
    const recipe = RECIPES[recipeId]
    const job = state.activities.transmutation.jobs[recipeId]
    if (!job?.acolyteAssigned || !isUnlocked(state, recipe)) continue
    const progress = normalizeProgress(job, recipe.baseDurationMs)
    const availableCrafts = getAvailableCrafts(state, recipe)
    if (availableCrafts <= 0) continue
    const workCapacity = Number.isFinite(availableCrafts)
      ? Math.max(0, availableCrafts * recipe.baseDurationMs - progress)
      : Number.POSITIVE_INFINITY
    const requestedProgressMs = Math.min(delta * getEffectiveTransmutationStaffedWorkMultiplier(state, true), workCapacity)
    if (requestedProgressMs <= TOWER_FLUX_EPSILON) continue
    const fluxPerCycle = getEffectiveTransmutationFluxCost(state, recipe)
    requests.push({
      key: requestKey(recipeId),
      system: 'transmutation',
      sourceId: recipeId,
      requestedProgressMs,
      fluxPerCycle,
      cycleDurationMs: recipe.baseDurationMs,
      requestedFlux: requestedFluxForProgress(fluxPerCycle, requestedProgressMs, recipe.baseDurationMs),
    })
  }
  return requests
}

/** Applies only work that the shared scheduler funded for this tick. */
export const applyTransmutationAllocations = (state: GameState, _requests: readonly TowerFluxWorkRequest[], allocations: Record<string, TowerFluxAllocation>, context: TransmutationAdvanceContext) => {
  for (const recipeId of RECIPE_ORDER) {
    const recipe = RECIPES[recipeId]
    const job = state.activities.transmutation.jobs[recipeId]
    if (!job?.acolyteAssigned || !isUnlocked(state, recipe)) continue
    const allocation = allocations[requestKey(recipeId)]
    const fundedProgressMs = allocation?.fundedProgressMs ?? 0
    const before = normalizeProgress(job, recipe.baseDurationMs)

    if (fundedProgressMs > TOWER_FLUX_EPSILON) job.progressMs = before + fundedProgressMs
    while (job.progressMs >= recipe.baseDurationMs - TOWER_FLUX_EPSILON) {
      if (!hasMaterialsForCycle(state, recipe)) {
        // Eligibility is planned from a pre-work snapshot. If an external
        // mutation invalidated it, retain only honest partial work.
        job.progressMs = Math.min(recipe.baseDurationMs - TOWER_FLUX_EPSILON, Math.max(0, job.progressMs))
        break
      }
      if (!completeTransmutationCycle(state, recipe, context)) break
      job.progressMs = Math.max(0, job.progressMs - recipe.baseDurationMs)
    }
    job.progressMs = Math.min(recipe.baseDurationMs - TOWER_FLUX_EPSILON, Math.max(0, job.progressMs))

    // The selector derives ACTIVE/MANA LIMITED/WAITING MANA from current
    // eligibility, Flux production, and the assigned Acolytes.
  }
  return state
}

/** Advances assigned recipes in stable output order after shared funding is planned. */
export function advanceTransmutation(state: GameState, deltaMs: number, context: TransmutationAdvanceContext = { mode: 'live' }, funding?: TowerFluxFundingResult) {
  const requests = buildTransmutationWorkRequests(state, deltaMs)
  const result = funding ?? allocateTowerFlux(state, requests)
  applyTransmutationAllocations(state, requests, result.allocations, context)
  return state
}

/** DEBUG ONLY: bypasses normal Mana timing to finish one cycle for test setup. */
export const forceCompleteTransmutationCycle = (state: GameState, recipeId: TransmutationRecipeId, context: TransmutationAdvanceContext) => {
  const recipe = RECIPES[recipeId]
  if (!recipe) return false
  if (!isUnlocked(state, recipe)) return false
  const job = state.activities.transmutation.jobs[recipeId] ?? (state.activities.transmutation.jobs[recipeId] = { acolyteAssigned: true, progressMs: 0 })
  if (!hasMaterialsForCycle(state, recipe)) {
    job.progressMs = 0
    return false
  }
  job.progressMs = 0
  return completeTransmutationCycle(state, recipe, context)
}

/** Completion consumes discrete ingredients and creates output; Mana was paid while work progressed. */
export const completeTransmutationCycle = (state: GameState, recipe: (typeof RECIPES)[TransmutationRecipeId], context: TransmutationAdvanceContext) => {
  if (RECIPES[recipe.id] !== recipe || !hasMaterialsForCycle(state, recipe)) return false
  const roll = context.random ?? Math.random
  const bonuses = getTransmutationArrayBonuses(state)
  const preserved = (recipe.ingredients.length > 0 || Object.keys(recipe.resonanceCost ?? {}).length > 0) && roll() < bonuses.preservationChance
  const resonanceCost = getEffectiveTransmutationResonanceCost(state, recipe)
  const consumedIngredients = preserved ? [] : recipe.ingredients
  if (!preserved) {
    if (!spendResonanceBundle(state.resonance, resonanceCost)) return false
    recipe.ingredients.forEach((ingredient) => {
    state.inventory[ingredient.itemId] = Math.max(0, (state.inventory[ingredient.itemId] ?? 0) - ingredient.quantity)
    })
  }
  const replicated = roll() < bonuses.replicationChance
  const outputQuantity = recipe.output.quantity * (replicated ? 2 : 1)
  grantItem(state, recipe.output.itemId, outputQuantity)
  context.onItemAcquired?.(recipe.output.itemId, outputQuantity)
  context.report?.recordTransmutation(recipe.id, recipe.output.itemId, outputQuantity, consumedIngredients)
  context.onTransmutationComplete?.(recipe.id)
  return true
}
