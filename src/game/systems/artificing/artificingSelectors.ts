import { ARTIFICING_RECIPES, ARTIFICING_RECIPE_ORDER, type ArtificingRecipeDefinition } from '../../content/recipes/artificingRecipes'
import { ITEMS } from '../../content/items/items'
import { EQUIPMENT_BUILD_TAG_LABELS, getPlayerEquipmentTier } from '../../content/items/equipmentBalance'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { isRecipeUnlocked, getRecipeUnlockRequirement } from '../../content/recipes/recipeUnlocks'
import { canCraftArtificingRecipe, getArtificingCraftIngredients, hasArtificingRecipeRequirements } from './artificingEngine'
import { ARTIFACTS, isArtifactId } from '../../content/artifacts/artifacts'
import { getArtifactMaxInvestedRanks, getArtifactTotalInvestedRanks } from '../artifacts/artifactProgression'
import type { ArtificingKindFilter, ArtificingTierFilter, ArtificingRecipeId, GameState, EquipmentItemSlot } from '../../types'

export { canCraftArtificingRecipe, getArtificingCraftIngredients, hasArtificingRecipeRequirements }
export const getArtificingUnlockReason = getRecipeUnlockRequirement
export interface ArtificingIngredientProgress { itemId: import('../../types').ItemId; available: number; required: number; missing: number; ready: boolean }
export const getArtificingMissingIngredients = (state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment' | 'activities'>, recipeId: import('../../types').ArtificingRecipeId): ArtificingIngredientProgress[] => {
  const ingredients = getArtificingCraftIngredients(recipeId)
  return ingredients ? ingredients.map((ingredient) => { const available = getConsumableQuantity(state, ingredient.itemId); return { itemId: ingredient.itemId, available, required: ingredient.quantity, missing: Math.max(0, ingredient.quantity - available), ready: available >= ingredient.quantity } }) : []
}
export const getArtificingCraftCapacity = (state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment' | 'activities'>, recipeId: import('../../types').ArtificingRecipeId) => {
  const ingredients = getArtificingCraftIngredients(recipeId)
  return ingredients?.length ? Math.min(...ingredients.map((ingredient) => Math.floor(getConsumableQuantity(state, ingredient.itemId) / ingredient.quantity))) : 0
}
export const getArtificingLimitingIngredient = (state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment' | 'activities'>, recipeId: import('../../types').ArtificingRecipeId) => {
  const ingredients = getArtificingCraftIngredients(recipeId)
  if (!ingredients?.length) return null
  const limiting = ingredients.reduce((lowest, ingredient) => getConsumableQuantity(state, ingredient.itemId) / ingredient.quantity < getConsumableQuantity(state, lowest.itemId) / lowest.quantity ? ingredient : lowest, ingredients[0])
  return ITEMS[limiting.itemId] ?? null
}

export interface ArtificingFilters { slotFilter: 'all' | EquipmentItemSlot; tierFilter: ArtificingTierFilter; kindFilter: ArtificingKindFilter; craftableOnly: boolean; ownershipFilter: 'all' | 'owned' | 'unowned' }
export const DEFAULT_ARTIFICING_FILTERS: ArtificingFilters = { slotFilter: 'all', tierFilter: 'all', kindFilter: 'all', craftableOnly: false, ownershipFilter: 'all' }
export const getArtificingRecipeEntries = () => ARTIFICING_RECIPE_ORDER.map((id) => ARTIFICING_RECIPES[id])
export const getArtificingProfile = (recipe: ArtificingRecipeDefinition) => ITEMS[recipe.output.itemId].equipmentSlot?.toUpperCase() ?? ''
export const getArtificingRecipePlayerTier = (recipe: ArtificingRecipeDefinition): number | undefined => {
  const item = ITEMS[recipe.output.itemId]
  const artifact = isArtifactId(recipe.output.itemId) ? ARTIFACTS[recipe.output.itemId] : undefined
  return artifact?.tier ?? (item.equipmentTier === undefined ? undefined : getPlayerEquipmentTier(item.equipmentTier))
}
export const isArtifactArtificingRecipe = (recipe: ArtificingRecipeDefinition) => isArtifactId(recipe.output.itemId)

export interface ArtifactArtificingState {
  owned: boolean
  tier: number
  investedRanks: number
  maxRanks: number
  mode: 'forge' | 'owned'
  ingredients: { itemId: import('../../types').ItemId; quantity: number }[]
  canStart: boolean
  reason?: string
}
export type ArtificingCatalogRecipeStatus = 'LOCKED' | 'FORGING' | 'CRAFTING' | 'FORGED' | 'READY' | 'MISSING'
export interface ArtificingCatalogRecipeState {
  kind: 'artifact' | 'equipment'
  locked: boolean
  ownedArtifact: boolean
  active: boolean
  activeForThis: boolean
  materialReady: boolean
  canStartNow: boolean
  status: ArtificingCatalogRecipeStatus
  artifactRanks?: number
  artifactMaxRanks?: number
}
export const getActiveArtificingJob = (state: Pick<GameState, 'activities'>) => state.activities.artificing.activeJob ?? (state.activities.artificing.activeRecipeId ? { kind: 'recipe' as const, recipeId: state.activities.artificing.activeRecipeId } : null)
const isOwnedArtifact = (state: Pick<GameState, 'inventory' | 'artifactProgress'>, artifactId: import('../../types').ArtifactId) => (state.inventory[artifactId] ?? 0) > 0 && Boolean(state.artifactProgress?.[artifactId])

export const getArtificingCatalogRecipeState = (state: GameState, recipeId: ArtificingRecipeId): ArtificingCatalogRecipeState | null => {
  const recipe = ARTIFICING_RECIPES[recipeId]
  if (!recipe) return null
  const artifactId = isArtifactId(recipe.output.itemId) ? recipe.output.itemId : null
  const artifact = artifactId ? ARTIFACTS[artifactId] : undefined
  const activeJob = getActiveArtificingJob(state)
  const activeForThis = Boolean(activeJob && (activeJob.kind === 'recipe' ? activeJob.recipeId === recipeId : activeJob.artifactId === recipeId))
  const locked = !isRecipeUnlocked(state, recipe)
  const ownedArtifact = Boolean(artifactId && isOwnedArtifact(state, artifactId))
  const materialReady = hasArtificingRecipeRequirements(state, recipeId)
  let status: ArtificingCatalogRecipeStatus
  if (locked) status = 'LOCKED'
  else if (activeForThis) status = artifact ? 'FORGING' : 'CRAFTING'
  else if (ownedArtifact) status = 'FORGED'
  else if (materialReady) status = 'READY'
  else status = 'MISSING'
  return { kind: artifact ? 'artifact' : 'equipment', locked, ownedArtifact, active: Boolean(activeJob), activeForThis, materialReady, canStartNow: materialReady && !activeJob, status, ...(artifact && artifactId ? { artifactRanks: getArtifactTotalInvestedRanks(state, artifactId), artifactMaxRanks: getArtifactMaxInvestedRanks(artifactId) } : {}) }
}

export const getArtifactArtificingState = (state: GameState, recipeId: import('../../types').ArtifactId): ArtifactArtificingState | null => {
  const artifact = ARTIFACTS[recipeId]
  const recipe = ARTIFICING_RECIPES[recipeId]
  if (!artifact || !recipe) return null
  const owned = isOwnedArtifact(state, recipeId)
  const investedRanks = getArtifactTotalInvestedRanks(state, recipeId)
  const maxRanks = getArtifactMaxInvestedRanks(recipeId)
  const base = { owned, tier: artifact.tier, investedRanks, maxRanks, ingredients: [] as ArtifactArtificingState['ingredients'], canStart: false }
  if (owned) return { ...base, mode: 'owned' }
  return { ...base, mode: 'forge', ingredients: artifact.forge.ingredients, canStart: canCraftArtificingRecipe(state, recipeId), reason: !isRecipeUnlocked(state, recipe) ? getRecipeUnlockRequirement(recipe) ?? undefined : undefined }
}

export function getVisibleArtificingRecipes(state: GameState, filters: ArtificingFilters = DEFAULT_ARTIFICING_FILTERS, query = '', showLocked = state.debug.showLockedArtificingRecipes) {
  const search = query.trim().toLowerCase()
  return getArtificingRecipeEntries().filter((recipe) => {
    const item = ITEMS[recipe.output.itemId]
    if (!showLocked && !isRecipeUnlocked(state, recipe)) return false
    if (filters.slotFilter !== 'all' && item.equipmentSlot !== filters.slotFilter) return false
    if (filters.tierFilter !== 'all' && getArtificingRecipePlayerTier(recipe) !== filters.tierFilter) return false
    if (filters.kindFilter === 'artifact' && !isArtifactArtificingRecipe(recipe)) return false
    if (filters.craftableOnly && !hasArtificingRecipeRequirements(state, recipe.id)) return false
    const owned = (state.inventory[recipe.output.itemId] ?? 0) > 0
    if ((filters.ownershipFilter === 'owned' && !owned) || (filters.ownershipFilter === 'unowned' && owned)) return false
    return !search || [recipe.id, recipe.name, item.name, item.equipmentSlot, item.buildTags?.map((tag) => `${tag} ${EQUIPMENT_BUILD_TAG_LABELS[tag]}`).join(' ')].filter(Boolean).join(' ').toLowerCase().includes(search)
  })
}
export function getArtificingFilterCounts(state: GameState, filters: ArtificingFilters, query = '') {
  const visible = getVisibleArtificingRecipes(state, filters, query)
  return { visible: visible.length, artifacts: visible.filter(isArtifactArtificingRecipe).length, equipment: visible.filter((recipe) => !isArtifactArtificingRecipe(recipe)).length, craftable: getVisibleArtificingRecipes(state, { ...filters, craftableOnly: true }, query).length, unlocked: getArtificingRecipeEntries().filter((recipe) => isRecipeUnlocked(state, recipe)).length }
}
