import { RECIPES, RECIPE_ORDER, type RecipeDefinition } from '../../content/recipes/recipes'
import { getEquippedReservedQuantity } from '../../core/equipment/equipmentRules'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { BALANCE } from '../../core/balance/balance'
import { selectFreeFocus } from '../../engine'
import { manaRegenPerSecond } from '../../engine/channelingEngine'
import { continuousManaPerSecond, estimateContinuousFundingRatio, CONTINUOUS_MANA_EPSILON, getContinuousManaDemandPerSecond } from '../simulation/continuousManaScheduler'
import type { GameState, RecipeId, TransmutationJobState } from '../../types'

export type TransmutationStatus = 'paused' | 'active' | 'mana-limited' | 'waiting-mana' | 'waiting-materials' | 'locked'

export interface RecipeConsumableRequirement {
  itemId: RecipeDefinition['ingredients'][number]['itemId']
  required: number
  owned: number
  equipped: number
  available: number
  protected: boolean
}

export const isRecipeUnlocked = (state: Pick<GameState, 'progress'>, recipe: RecipeDefinition) => recipe.unlock.type === 'always' || state.progress.firstBossKill
export const getTransmutationJob = (state: Pick<GameState, 'activities'>, recipeId: RecipeId): TransmutationJobState | undefined => state.activities.transmutation.jobs[recipeId]
export const getTransmutationEchoesAssigned = (state: Pick<GameState, 'activities'>) => RECIPE_ORDER.reduce((total, recipeId) => total + Math.max(0, Math.floor(state.activities.transmutation.jobs[recipeId]?.echoesAssigned ?? 0)), 0)
export const getTransmutationEchoCapacity = (state: Pick<GameState, 'activities'> & Partial<Pick<GameState, 'debug'>>) => state.debug?.ignoreEchoLimit ? Number.MAX_SAFE_INTEGER : Math.max(0, Math.floor(state.debug?.transmutationEchoCapacityOverride ?? BALANCE.transmutation.maxEchoes))
export const getTransmutationFreeEchoCapacity = (state: Pick<GameState, 'activities'> & Partial<Pick<GameState, 'debug'>>) => Math.max(0, getTransmutationEchoCapacity(state) - getTransmutationEchoesAssigned(state))
export const getTransmutationEchoFocusCost = () => BALANCE.transmutation.echoFocusCost
export const getTransmutationFocusReserved = (echoesAssigned: number) => Math.max(0, Math.floor(echoesAssigned)) * BALANCE.transmutation.echoFocusCost
export const getTransmutationSpeedMultiplier = (echoesAssigned: number) => Math.max(1, Math.floor(echoesAssigned))
export const getRecipeCurrentSpeedMultiplier = (echoesAssigned: number) => Math.max(0, Math.floor(Number.isFinite(echoesAssigned) ? echoesAssigned : 0))
export const canAssignTransmutationEcho = (state: Pick<GameState, 'activities' | 'progress' | 'player'> & Partial<Pick<GameState, 'debug'>>) => getTransmutationFreeEchoCapacity(state) > 0 && Boolean(state.debug?.allowFocusOverCap || selectFreeFocus(state) >= BALANCE.transmutation.echoFocusCost)
export const getRecipeEffectiveDuration = (recipe: RecipeDefinition, echoesAssigned: number) => recipe.baseDurationMs / Math.max(1, echoesAssigned)
export const getRecipeCurrentEffectiveDuration = (recipe: RecipeDefinition, echoesAssigned: number) => getRecipeCurrentSpeedMultiplier(echoesAssigned) > 0 ? recipe.baseDurationMs / getRecipeCurrentSpeedMultiplier(echoesAssigned) : null
export const getRecipeCurrentRemainingDuration = (recipe: RecipeDefinition, progressMs: number, echoesAssigned: number) => getRecipeCurrentSpeedMultiplier(echoesAssigned) > 0 ? getRecipeRemainingMs(recipe, progressMs) / getRecipeCurrentSpeedMultiplier(echoesAssigned) : null
export const getRecipeCraftsPerHour = (recipe: RecipeDefinition, echoesAssigned: number) => Math.max(0, echoesAssigned) * 3_600_000 / Math.max(1, recipe.baseDurationMs)
export const getRecipeOutputPerHour = (recipe: RecipeDefinition, echoesAssigned: number) => getRecipeCraftsPerHour(recipe, echoesAssigned) * recipe.output.quantity
export const getRecipeCurrentOutputPerHour = (recipe: RecipeDefinition, echoesAssigned: number) => getRecipeCurrentSpeedMultiplier(echoesAssigned) > 0 ? getRecipeOutputPerHour(recipe, echoesAssigned) : 0
export const getRecipeRemainingMs = (recipe: RecipeDefinition, progressMs: number) => Math.max(0, recipe.baseDurationMs - Math.max(0, progressMs))
export const getRecipeManaDemandPerSecond = (recipe: RecipeDefinition, echoesAssigned: number) => continuousManaPerSecond(recipe.manaCost, recipe.baseDurationMs, echoesAssigned)
export const getRecipeProgressPercent = (recipe: RecipeDefinition, progressMs: number) => Math.min(100, Math.max(0, progressMs / Math.max(1, recipe.baseDurationMs) * 100))

export function getRecipeConsumableRequirements(state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment'>, recipe: RecipeDefinition): RecipeConsumableRequirement[] {
  return recipe.ingredients.map((ingredient) => ({
    itemId: ingredient.itemId,
    required: ingredient.quantity,
    owned: Math.max(0, Math.floor(state.inventory[ingredient.itemId] ?? 0)),
    equipped: getEquippedReservedQuantity(state, ingredient.itemId),
    available: getConsumableQuantity(state, ingredient.itemId),
    protected: Boolean(state.protectedItems[ingredient.itemId]),
  }))
}

export const hasRecipeMaterials = (state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment'>, recipe: RecipeDefinition) => getRecipeConsumableRequirements(state, recipe).every((requirement) => requirement.available >= requirement.required)
export const isRecipeCraftable = (state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment' | 'player' | 'progress'>, recipe: RecipeDefinition) => isRecipeUnlocked(state, recipe) && state.player.mana >= recipe.manaCost && hasRecipeMaterials(state, recipe)

export function getRecipeStatus(state: Pick<GameState, 'activities' | 'inventory' | 'protectedItems' | 'equipment' | 'player' | 'progress' | 'schools'> & Partial<Pick<GameState, 'debug'>>, recipe: RecipeDefinition): TransmutationStatus {
  if (!isRecipeUnlocked(state, recipe)) return 'locked'
  const job = state.activities.transmutation.jobs[recipe.id]
  const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? 0))
  if (echoes <= 0) return 'paused'
  if (!hasRecipeMaterials(state, recipe)) return 'waiting-materials'
  if (recipe.manaCost > 0) {
    const demand = getContinuousManaDemandPerSecond(state)
    const ratio = estimateContinuousFundingRatio(state.player.mana, manaRegenPerSecond(state), demand, BALANCE.tickMs)
    if (ratio <= CONTINUOUS_MANA_EPSILON) return 'waiting-mana'
    if (ratio < 1 - CONTINUOUS_MANA_EPSILON) return 'mana-limited'
  }
  return 'active'
}

export const getTransmutationRecipeEntries = () => RECIPE_ORDER.map((id) => RECIPES[id])
export const getRecipeUnlockReason = (recipe: RecipeDefinition) => recipe.unlock.type === 'first-grove-sentinel-kill' ? 'Defeat Grove Sentinel to unlock this recipe.' : null
