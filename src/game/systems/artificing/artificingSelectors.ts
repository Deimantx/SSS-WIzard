import { ARTIFICING_RECIPES, ARTIFICING_RECIPE_ORDER, type ArtificingRecipeDefinition } from '../../content/recipes/artificingRecipes'
import { ITEMS } from '../../content/items/items'
import { EQUIPMENT_BUILD_TAG_LABELS, getPlayerEquipmentTier } from '../../content/items/equipmentBalance'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { isRecipeUnlocked, getRecipeUnlockRequirement } from '../../content/recipes/recipeUnlocks'
import { canCraftArtificingRecipe, getArtificingCraftIngredients, hasArtificingRecipeRequirements } from './artificingEngine'
import { ARTIFACTS } from '../../content/artifacts/artifacts'
import { canUpgradeArtifact, getArtifactLevel, getArtifactLevelCap, getArtifactUpgrade } from '../artifacts/artifactProgression'
import type { ArtificingKindFilter, ArtificingTierFilter, ArtificingRecipeId, GameState, EquipmentItemSlot } from '../../types'
export { canCraftArtificingRecipe, getArtificingCraftIngredients, hasArtificingRecipeRequirements }
export const getArtificingUnlockReason = getRecipeUnlockRequirement
export interface ArtificingIngredientProgress { itemId: import('../../types').ItemId; available: number; required: number; missing: number; ready: boolean }
export const getArtificingMissingIngredients = (state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment' | 'activities'>, recipeId: import('../../types').ArtificingRecipeId): ArtificingIngredientProgress[] => { const ingredients = getArtificingCraftIngredients(recipeId); return ingredients ? ingredients.map(i => { const available = getConsumableQuantity(state, i.itemId); return { itemId: i.itemId, available, required: i.quantity, missing: Math.max(0, i.quantity - available), ready: available >= i.quantity } }) : [] }
export const getArtificingCraftCapacity = (state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment' | 'activities'>, recipeId: import('../../types').ArtificingRecipeId) => { const ingredients = getArtificingCraftIngredients(recipeId); return ingredients?.length ? Math.min(...ingredients.map(i => Math.floor(getConsumableQuantity(state, i.itemId) / i.quantity))) : 0 }
export const getArtificingLimitingIngredient = (state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment' | 'activities'>, recipeId: import('../../types').ArtificingRecipeId) => { const ingredients = getArtificingCraftIngredients(recipeId); if (!ingredients?.length) return null; const limiting = ingredients.reduce((lowest, ingredient) => getConsumableQuantity(state, ingredient.itemId) / ingredient.quantity < getConsumableQuantity(state, lowest.itemId) / lowest.quantity ? ingredient : lowest, ingredients[0]); return ITEMS[limiting.itemId] ?? null }
export interface ArtificingFilters {
  slotFilter: 'all' | EquipmentItemSlot
  tierFilter: ArtificingTierFilter
  kindFilter: ArtificingKindFilter
  weaponHandsFilter: 'all' | 1 | 2
  offhandPresentationFilter: 'all' | 'shield' | 'focus'
  craftableOnly: boolean
  ownershipFilter: 'all' | 'owned' | 'unowned'
}
export const DEFAULT_ARTIFICING_FILTERS: ArtificingFilters = { slotFilter: 'all', tierFilter: 'all', kindFilter: 'all', weaponHandsFilter: 'all', offhandPresentationFilter: 'all', craftableOnly: false, ownershipFilter: 'all' }
export const getArtificingRecipeEntries = () => ARTIFICING_RECIPE_ORDER.map(id => ARTIFICING_RECIPES[id])
export const getArtificingProfile = (recipe: ArtificingRecipeDefinition) => {
  const item = ITEMS[recipe.output.itemId]
  return [item.equipmentSlot?.toUpperCase(), item.weaponHands ? `${item.weaponHands}H` : item.equipmentPresentation?.toUpperCase()].filter(Boolean).join(' · ')
}

export const getArtificingRecipePlayerTier = (recipe: ArtificingRecipeDefinition): number | undefined => {
  const item = ITEMS[recipe.output.itemId]
  const artifact = ARTIFACTS[recipe.output.itemId]
  return artifact?.tier ?? (item.equipmentTier === undefined ? undefined : getPlayerEquipmentTier(item.equipmentTier))
}

export const isArtifactArtificingRecipe = (recipe: ArtificingRecipeDefinition) => Boolean(ARTIFACTS[recipe.output.itemId])

export interface ArtifactArtificingState {
  owned: boolean
  tier: number
  level: number
  maxLevel: number
  levelCap: number
  mode: 'forge' | 'upgrade' | 'level-cap' | 'max-level'
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
  artifactLevel?: number
  artifactMaxLevel?: number
}

export const getActiveArtificingJob = (state: Pick<GameState, 'activities'>) => state.activities.artificing.activeJob ?? (state.activities.artificing.activeRecipeId ? { kind: 'recipe' as const, recipeId: state.activities.artificing.activeRecipeId } : null)

const isOwnedArtifact = (state: Pick<GameState, 'inventory' | 'artifactProgress'>, recipeId: ArtificingRecipeId) => (state.inventory[recipeId] ?? 0) > 0 && Boolean(state.artifactProgress?.[recipeId])

export const getArtificingCatalogRecipeState = (state: GameState, recipeId: ArtificingRecipeId): ArtificingCatalogRecipeState | null => {
  const recipe = ARTIFICING_RECIPES[recipeId]
  if (!recipe) return null
  const artifact = ARTIFACTS[recipeId]
  const activeJob = getActiveArtificingJob(state)
  const activeForThis = Boolean(activeJob && (activeJob.kind === 'recipe' ? activeJob.recipeId === recipeId : activeJob.artifactId === recipeId))
  const locked = !isRecipeUnlocked(state, recipe)
  const ownedArtifact = Boolean(artifact && isOwnedArtifact(state, recipeId))
  const materialReady = hasArtificingRecipeRequirements(state, recipeId)
  let status: ArtificingCatalogRecipeStatus
  if (locked) status = 'LOCKED'
  else if (activeForThis) status = artifact ? 'FORGING' : 'CRAFTING'
  else if (ownedArtifact) status = 'FORGED'
  else if (materialReady) status = 'READY'
  else status = 'MISSING'
  return { kind: artifact ? 'artifact' : 'equipment', locked, ownedArtifact, active: Boolean(activeJob), activeForThis, materialReady, canStartNow: materialReady && !activeJob, status, ...(artifact ? { artifactLevel: state.artifactProgress?.[recipeId]?.level ?? 0, artifactMaxLevel: artifact.maxLevel } : {}) }
}

export const getArtifactArtificingState = (state: GameState, recipeId: import('../../types').ArtificingRecipeId): ArtifactArtificingState | null => {
  const artifact = ARTIFACTS[recipeId]
  const recipe = ARTIFICING_RECIPES[recipeId]
  if (!artifact || !recipe) return null
  const progress = state.artifactProgress?.[recipeId]
  const owned = isOwnedArtifact(state, recipeId)
  const level = progress?.level ?? 0
  const levelCap = getArtifactLevelCap(state, recipeId)
  const base = { owned, tier: artifact.tier, level, maxLevel: artifact.maxLevel, levelCap, ingredients: [] as ArtifactArtificingState['ingredients'], canStart: false }
  if (!owned) return { ...base, level: 0, mode: 'forge', ingredients: artifact.forge.ingredients, canStart: canCraftArtificingRecipe(state, recipeId), reason: !isRecipeUnlocked(state, recipe) ? getRecipeUnlockRequirement(recipe) ?? undefined : undefined }
  if (level >= artifact.maxLevel) return { ...base, mode: 'max-level', reason: 'MAX ARTIFACT LEVEL' }
  const upgrade = getArtifactUpgrade(recipeId, level)
  if (level >= levelCap) return { ...base, mode: 'level-cap', reason: `Continue progression to unlock Artifact Level ${levelCap + 1}.` }
  if (!upgrade) return { ...base, mode: 'max-level', reason: 'MAX ARTIFACT LEVEL' }
  return { ...base, mode: 'upgrade', ingredients: upgrade.ingredients, canStart: canUpgradeArtifact(state, recipeId), reason: canUpgradeArtifact(state, recipeId) ? undefined : 'Not enough legal upgrade materials.' }
}
export function getVisibleArtificingRecipes(state: GameState, filters: ArtificingFilters = DEFAULT_ARTIFICING_FILTERS, query = '', showLocked = state.debug.showLockedArtificingRecipes) {
  const search = query.trim().toLowerCase()
  return getArtificingRecipeEntries().filter(recipe => {
    const item = ITEMS[recipe.output.itemId]
    if (!showLocked && !isRecipeUnlocked(state, recipe)) return false
    if (filters.slotFilter !== 'all' && item.equipmentSlot !== filters.slotFilter) return false
    if (filters.tierFilter !== 'all' && getArtificingRecipePlayerTier(recipe) !== filters.tierFilter) return false
    if (filters.kindFilter === 'artifact' && !isArtifactArtificingRecipe(recipe)) return false
    if (filters.kindFilter === 'equipment' && isArtifactArtificingRecipe(recipe)) return false
    if (filters.slotFilter === 'weapon' && filters.weaponHandsFilter !== 'all' && item.weaponHands !== filters.weaponHandsFilter) return false
    if (filters.slotFilter === 'offhand' && filters.offhandPresentationFilter !== 'all' && item.equipmentPresentation !== filters.offhandPresentationFilter) return false
    if (filters.craftableOnly && !hasArtificingRecipeRequirements(state, recipe.id)) return false
    const owned = (state.inventory[recipe.output.itemId] ?? 0) > 0
    if (filters.ownershipFilter === 'owned' && !owned || filters.ownershipFilter === 'unowned' && owned) return false
    return !search || [recipe.id, recipe.name, item.name, item.equipmentSlot, item.buildTags?.map((tag) => `${tag} ${EQUIPMENT_BUILD_TAG_LABELS[tag]}`).join(' ')].filter(Boolean).join(' ').toLowerCase().includes(search)
  })
}
export function getArtificingFilterCounts(state: GameState, filters: ArtificingFilters, query = '') {
  const visible = getVisibleArtificingRecipes(state, filters, query)
  return {
    visible: visible.length,
    artifacts: visible.filter(isArtifactArtificingRecipe).length,
    equipment: visible.filter((recipe) => !isArtifactArtificingRecipe(recipe)).length,
    craftable: getVisibleArtificingRecipes(state, { ...filters, craftableOnly: true }, query).length,
    unlocked: getArtificingRecipeEntries().filter(recipe => isRecipeUnlocked(state, recipe)).length,
  }
}
