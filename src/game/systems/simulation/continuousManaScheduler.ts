import type { GameState } from '../../types'
import { RECIPES, RECIPE_ORDER } from '../../content/recipes/recipes'
import { ITEMS } from '../../content/items/items'
import { SCHOOLS } from '../../content/schools/schools'
import { BALANCE } from '../../core/balance/balance'
import { getEquippedReservedQuantity } from '../../core/equipment/equipmentRules'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'

export type ContinuousManaConsumerSystem = 'research' | 'transmutation'

export interface ContinuousManaWorkRequest {
  key: string
  system: ContinuousManaConsumerSystem
  sourceId: string
  requestedProgressMs: number
  manaPerCycle: number
  cycleDurationMs: number
  requestedMana: number
}

export interface ContinuousManaAllocation {
  key: string
  fundedProgressMs: number
  manaSpent: number
}

export interface ContinuousManaFundingResult {
  requestedMana: number
  spentMana: number
  fundingRatio: number
  allocations: Record<string, ContinuousManaAllocation>
}

export const CONTINUOUS_MANA_EPSILON = 1e-9

const finiteNonNegative = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0

/**
 * Continuous Mana allocation must be independent of recipe/slot authored order.
 * Every positive-Mana request shares the available buffer by the same ratio.
 */
export const allocateContinuousMana = (state: GameState, requests: readonly ContinuousManaWorkRequest[]): ContinuousManaFundingResult => {
  const normalized = requests.map((request) => ({
    ...request,
    requestedProgressMs: finiteNonNegative(request.requestedProgressMs),
    manaPerCycle: finiteNonNegative(request.manaPerCycle),
    cycleDurationMs: Math.max(1, finiteNonNegative(request.cycleDurationMs)),
    requestedMana: finiteNonNegative(request.requestedMana),
  }))
  const requestedMana = normalized.reduce((total, request) => total + request.requestedMana, 0)
  const availableMana = finiteNonNegative(state.player.mana)
  const fundingRatio = requestedMana <= CONTINUOUS_MANA_EPSILON
    ? 1
    : Math.min(1, Math.max(0, availableMana / requestedMana))
  const allocations: Record<string, ContinuousManaAllocation> = {}
  let spentMana = 0

  normalized.forEach((request) => {
    const fundedProgressMs = request.manaPerCycle <= CONTINUOUS_MANA_EPSILON
      ? request.requestedProgressMs
      : request.requestedProgressMs * fundingRatio
    const manaSpent = request.manaPerCycle <= CONTINUOUS_MANA_EPSILON
      ? 0
      : request.requestedMana * fundingRatio
    allocations[request.key] = { key: request.key, fundedProgressMs, manaSpent }
    spentMana += manaSpent
  })

  // The scheduler is the only owner of continuous-work Mana payment. Keep
  // fractional Mana internally and only repair floating-point underflow.
  // Do not normalize the upper bound here: a debug over-cap reserve must be
  // spendable, and ordinary state hydration/recalculation owns max-Mana repair.
  state.player.mana = Math.max(0, availableMana - spentMana)

  return { requestedMana, spentMana, fundingRatio, allocations }
}

export const requestedManaForProgress = (manaPerCycle: number, requestedProgressMs: number, cycleDurationMs: number) =>
  finiteNonNegative(manaPerCycle) * finiteNonNegative(requestedProgressMs) / Math.max(1, finiteNonNegative(cycleDurationMs))

export const continuousManaPerSecond = (manaPerCycle: number, cycleDurationMs: number, echoes: number) =>
  finiteNonNegative(manaPerCycle) * finiteNonNegative(echoes) / (Math.max(1, finiteNonNegative(cycleDurationMs)) / 1000)

/** Read-only nominal demand used by status and telemetry projections. */
type ContinuousManaDemandState = Pick<GameState, 'activities' | 'inventory' | 'protectedItems' | 'equipment' | 'schools' | 'progress'>

export const getContinuousManaDemandPerSecond = (state: ContinuousManaDemandState) => {
  let demand = 0
  RECIPE_ORDER.forEach((recipeId) => {
    const recipe = RECIPES[recipeId]
    const job = state.activities.transmutation.jobs[recipeId]
    const echoes = Math.max(0, Math.floor(finiteNonNegative(job?.echoesAssigned)))
    const unlocked = recipe.unlock.type === 'always' || state.progress.firstBossKill
    const hasMaterials = recipe.ingredients.every((ingredient) => getConsumableQuantity(state, ingredient.itemId) >= ingredient.quantity)
    if (echoes > 0 && unlocked && recipe.manaCost > 0 && hasMaterials) demand += continuousManaPerSecond(recipe.manaCost, recipe.baseDurationMs, echoes)
  })

  const research = state.activities.research
  const researchSlots = research.slots && typeof research.slots === 'object'
    ? Object.values(research.slots)
    : research.running && research.itemId && research.targetSchoolId
      ? [{ itemId: research.itemId, targetSchoolId: research.targetSchoolId, remainingQuantity: research.remainingQuantity, echoesAssigned: 1 }]
      : []
  researchSlots.forEach((job) => {
    if (!job || !ITEMS[job.itemId]?.researchSchool || !SCHOOLS[job.targetSchoolId]) return
    const echoes = Math.max(0, Math.floor(finiteNonNegative(job.echoesAssigned)))
    const available = Math.max(0, Math.floor(finiteNonNegative(state.inventory[job.itemId])) - getEquippedReservedQuantity(state, job.itemId))
    const blocked = Boolean(state.protectedItems[job.itemId]) || Object.values(state.equipment).includes(job.itemId) || state.schools[job.targetSchoolId].level >= state.progress.magicLevelCap
    if (echoes > 0 && finiteNonNegative(job.remainingQuantity) > 0 && available > 0 && !blocked) demand += continuousManaPerSecond(BALANCE.research.manaCostPerItem, BALANCE.research.durationPerItemMs, echoes)
  })
  return demand
}

/** Approximate the current tick's funding for status/telemetry without mutating state. */
export const estimateContinuousFundingRatio = (availableMana: number, productionPerSecond: number, requestedManaPerSecond: number, tickMs: number) => {
  const demand = finiteNonNegative(requestedManaPerSecond) * Math.max(0, finiteNonNegative(tickMs)) / 1000
  if (demand <= CONTINUOUS_MANA_EPSILON) return 1
  const available = finiteNonNegative(availableMana) + finiteNonNegative(productionPerSecond) * Math.max(0, finiteNonNegative(tickMs)) / 1000
  return Math.min(1, Math.max(0, available / demand))
}
