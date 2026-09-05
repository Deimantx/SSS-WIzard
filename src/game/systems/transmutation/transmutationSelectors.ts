import { TRANSMUTATION_RECIPES as RECIPES, TRANSMUTATION_RECIPE_ORDER as RECIPE_ORDER, getRecipeUnlockRequirement, isRecipeUnlocked as isAuthoredRecipeUnlocked, type RecipeDefinition } from '../../content/recipes/recipes'
import { ITEMS } from '../../content/items/items'
import { getEquippedReservedQuantity } from '../../core/equipment/equipmentRules'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { BALANCE } from '../../core/balance/balance'
import { selectFreeFocus } from '../../engine'
import { manaRegenPerSecond } from '../../engine/channelingEngine'
import { continuousManaPerSecond, estimateContinuousFundingRatio, CONTINUOUS_MANA_EPSILON, getContinuousManaDemandPerSecond } from '../simulation/continuousManaScheduler'
import type { EquipmentItemSlot, GameState, ItemId, RecipeCategory, TransmutationRecipeId, TransmutationCategoryFilter, TransmutationJobState, TransmutationTierFilter } from '../../types'

export interface TransmutationRecipeFilters {
  categoryFilter: TransmutationCategoryFilter
  tierFilter: TransmutationTierFilter
  craftableOnly: boolean
  activeOnly: boolean
}

export interface TransmutationRecipeFilterCounts {
  visible: number
  unlocked: number
  hiddenLocked: number
  categories: Record<'all' | RecipeCategory, number>
  tierCounts: { elemental: Record<number, number>; material: Record<number, number> }
  craftable: number
  active: number
}

export type TransmutationStatus = 'paused' | 'active' | 'mana-limited' | 'waiting-mana' | 'waiting-materials' | 'locked'

export interface RecipeConsumableRequirement {
  itemId: RecipeDefinition['ingredients'][number]['itemId']
  required: number
  owned: number
  equipped: number
  available: number
  protected: boolean
}

export interface RecipeMaterialCapacity {
  cycles: number | null
  limitingItemId: ItemId | null
  missing: Array<{ itemId: ItemId; quantity: number }>
}

export const isRecipeUnlocked = isAuthoredRecipeUnlocked
export const getTransmutationJob = (state: Pick<GameState, 'activities'>, recipeId: TransmutationRecipeId): TransmutationJobState | undefined => state.activities.transmutation.jobs[recipeId]
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

/** Derived material-only production limits. Mana is intentionally not part of this capacity. */
export function getRecipeMaterialCapacity(requirements: RecipeConsumableRequirement[]): RecipeMaterialCapacity {
  if (requirements.length === 0) return { cycles: null, limitingItemId: null, missing: [] }
  const ratios = requirements.map((requirement) => ({ requirement, cycles: Math.floor(Math.max(0, requirement.available) / Math.max(1, requirement.required)) }))
  const cycles = Math.min(...ratios.map(({ cycles: availableCycles }) => availableCycles))
  const limitingItemId = ratios.find(({ cycles: availableCycles }) => availableCycles === cycles)?.requirement.itemId ?? null
  return { cycles, limitingItemId, missing: requirements.flatMap((requirement) => { const quantity = Math.max(0, requirement.required - requirement.available); return quantity > 0 ? [{ itemId: requirement.itemId, quantity }] : [] }) }
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
export const getRecipeUnlockReason = getRecipeUnlockRequirement

const CATEGORY_LABELS: Record<RecipeCategory, string> = { elemental: 'elemental', material: 'materials' }

function recipeSearchText(recipe: RecipeDefinition) {
  const item = ITEMS[recipe.output.itemId]
  return [recipe.name, recipe.description, item.name, item.description, item.source, item.materialSubtype, CATEGORY_LABELS[recipe.category]].filter(Boolean).join(' ').toLowerCase()
}

function matchesRecipeContext(state: Pick<GameState, 'inventory' | 'equipment'>, recipe: RecipeDefinition, filters: TransmutationRecipeFilters) {
  const item = ITEMS[recipe.output.itemId]
  if (filters.categoryFilter !== 'all' && recipe.category !== filters.categoryFilter) return false
  if (filters.tierFilter !== 'all' && (recipe.category !== 'elemental' && recipe.category !== 'material' || item.materialTier !== filters.tierFilter)) return false
  return true
}

function matchesRecipeState(state: Pick<GameState, 'activities' | 'inventory' | 'protectedItems' | 'equipment' | 'player' | 'progress' | 'schools'> & Partial<Pick<GameState, 'debug'>>, recipe: RecipeDefinition, filters: TransmutationRecipeFilters) {
  if (filters.craftableOnly && !isRecipeCraftable(state, recipe)) return false
  if (filters.activeOnly && Math.max(0, Math.floor(getTransmutationJob(state, recipe.id)?.echoesAssigned ?? 0)) <= 0) return false
  return true
}

export function matchesTransmutationRecipe(state: Pick<GameState, 'activities' | 'inventory' | 'protectedItems' | 'equipment' | 'player' | 'progress' | 'schools'> & Partial<Pick<GameState, 'debug'>>, recipe: RecipeDefinition, filters: TransmutationRecipeFilters, query = '', showLocked = false) {
  if (!showLocked && !isRecipeUnlocked(state, recipe)) return false
  if (!matchesRecipeContext(state, recipe, filters) || !matchesRecipeState(state, recipe, filters)) return false
  const normalizedQuery = query.trim().toLowerCase()
  return normalizedQuery.length === 0 || recipeSearchText(recipe).includes(normalizedQuery)
}

export function getVisibleTransmutationRecipes(state: Pick<GameState, 'activities' | 'inventory' | 'protectedItems' | 'equipment' | 'player' | 'progress' | 'schools'> & Partial<Pick<GameState, 'debug'>>, filters: TransmutationRecipeFilters, query = '', showLocked = false) {
  return getTransmutationRecipeEntries().filter((recipe) => matchesTransmutationRecipe(state, recipe, filters, query, showLocked))
}

export function getTransmutationTierOptions() {
  const tiers = getTransmutationRecipeEntries().map((recipe) => ITEMS[recipe.output.itemId].materialTier).filter((tier): tier is number => typeof tier === 'number' && Number.isInteger(tier) && tier >= 1)
  return [...new Set(tiers)].sort((a, b) => a - b)
}

export function getTransmutationRecipeFilterCounts(state: Pick<GameState, 'activities' | 'inventory' | 'protectedItems' | 'equipment' | 'player' | 'progress' | 'schools'> & Partial<Pick<GameState, 'debug'>>, filters: TransmutationRecipeFilters, query = '', showLocked = false): TransmutationRecipeFilterCounts {
  const recipes = getTransmutationRecipeEntries()
  const accessible = recipes.filter((recipe) => showLocked || isRecipeUnlocked(state, recipe))
  const counts: TransmutationRecipeFilterCounts = {
    visible: getVisibleTransmutationRecipes(state, filters, query, showLocked).length,
    unlocked: recipes.filter((recipe) => isRecipeUnlocked(state, recipe)).length,
    hiddenLocked: recipes.filter((recipe) => !isRecipeUnlocked(state, recipe)).length,
    categories: { all: accessible.length, elemental: 0, material: 0 },
          tierCounts: { elemental: {}, material: {} },
    craftable: accessible.filter((recipe) => isRecipeCraftable(state, recipe)).length,
    active: accessible.filter((recipe) => Math.max(0, Math.floor(getTransmutationJob(state, recipe.id)?.echoesAssigned ?? 0)) > 0).length,
    }
  for (const recipe of accessible) {
    counts.categories[recipe.category] += 1
    const item = ITEMS[recipe.output.itemId]
    if ((recipe.category === 'elemental' || recipe.category === 'material') && item.materialTier) {
      counts.tierCounts[recipe.category][item.materialTier] = (counts.tierCounts[recipe.category][item.materialTier] ?? 0) + 1
    }
  }
  return counts
}
