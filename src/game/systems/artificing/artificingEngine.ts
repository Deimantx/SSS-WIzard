import { ARTIFICING_RECIPES } from '../../content/recipes/artificingRecipes'
import { ITEMS } from '../../content/items/items'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { grantItem } from '../inventory/itemAcquisition'
import { ARTIFACTS } from '../../content/artifacts/artifacts'
import { isRecipeUnlocked, getRecipeUnlockRequirement } from '../../content/recipes/recipeUnlocks'
import { canUpgradeArtifact, getArtifactUpgrade, getArtifactLevelCap, completeArtifactForge } from '../artifacts/artifactProgression'
import type { ArtificingRecipeId, ArtifactId, GameState, ItemId } from '../../types'
export type ArtificingCraftResult = { ok: true; itemId: ItemId } | { ok: false; reason: string }
export type ArtificingCompletion =
  | { kind: 'recipe'; recipeId: ArtificingRecipeId; itemId: ItemId; quantity: 1 }
  | { kind: 'artifact-forge'; recipeId: ArtificingRecipeId; artifactId: ArtifactId; itemId: ItemId }
const active = (state: GameState) => state.activities.artificing.activeJob ?? (state.activities.artificing.activeRecipeId ? { kind: 'recipe' as const, recipeId: state.activities.artificing.activeRecipeId } : null)
const clear = (state: GameState) => { state.activities.artificing = { activeJob: null, activeRecipeId: null, progressMs: 0 } }
export const getArtificingCraftIngredients = (id: ArtificingRecipeId | ArtifactId) => ARTIFACTS[id as ArtifactId]?.forge.ingredients ?? ARTIFICING_RECIPES[id as ArtificingRecipeId]?.ingredients
const artifactAlreadyOwned = (state: Pick<GameState, 'inventory' | 'artifactProgress'>, id: ArtificingRecipeId) => Boolean(ARTIFACTS[id] && ((state.inventory[id] ?? 0) > 0 || state.artifactProgress?.[id]))
export const hasArtificingRecipeRequirements = (state: Pick<GameState, 'progress' | 'inventory' | 'protectedItems' | 'equipment' | 'activities' | 'artifactProgress'>, id: ArtificingRecipeId) => Boolean(ARTIFICING_RECIPES[id] && isRecipeUnlocked(state, ARTIFICING_RECIPES[id]) && !artifactAlreadyOwned(state, id) && getArtificingCraftIngredients(id)?.every(i => getConsumableQuantity(state, i.itemId) >= i.quantity))
export const canCraftArtificingRecipe = (state: Pick<GameState, 'progress' | 'inventory' | 'protectedItems' | 'equipment' | 'activities' | 'artifactProgress'>, id: ArtificingRecipeId) => Boolean(hasArtificingRecipeRequirements(state, id) && !active(state as GameState))
export const startArtificingCraft = (state: GameState, id: ArtificingRecipeId): ArtificingCraftResult => {
  const recipe = ARTIFICING_RECIPES[id]; const ingredients = getArtificingCraftIngredients(id)
  if (!recipe || ITEMS[recipe.output.itemId]?.kind !== 'equipment') return { ok: false, reason: 'Unknown Artificing recipe.' }
  if (active(state)) return { ok: false, reason: 'Another Artificing job is already in progress.' }
  if (!isRecipeUnlocked(state, recipe)) return { ok: false, reason: getRecipeUnlockRequirement(recipe) ?? 'This recipe is locked.' }
  if (ARTIFACTS[id] && (state.inventory[id] ?? 0) > 0) return { ok: false, reason: 'This Artifact can only be forged once.' }
  if (!ingredients?.every(i => getConsumableQuantity(state, i.itemId) >= i.quantity)) return { ok: false, reason: 'Not enough legal ingredients.' }
  ingredients.forEach(({ itemId, quantity }) => { state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) - quantity) })
  state.activities.artificing = { activeJob: ARTIFACTS[id] ? { kind: 'artifact-forge', artifactId: id } : { kind: 'recipe', recipeId: id }, activeRecipeId: ARTIFACTS[id] ? null : id, progressMs: 0 }
  return { ok: true, itemId: recipe.output.itemId }
}
export const upgradeArtifactInstant = (state: GameState, id: ArtifactId, options?: { free?: boolean }): ArtificingCraftResult => {
  if (!ARTIFACTS[id]) return { ok: false, reason: 'Artifact is not owned.' }
  const progress = state.artifactProgress?.[id]
  if (!progress) return { ok: false, reason: 'Artifact progression is missing or invalid.' }
  const upgrade = getArtifactUpgrade(id, progress.level); const cap = getArtifactLevelCap(state, id)
  const free = options?.free ?? Boolean(state.debug.artifactFreeUpgrade)
  if ((state.inventory[id] ?? 0) < 1) return { ok: false, reason: 'Artifact is not owned.' }
  if (progress.level >= cap) return { ok: false, reason: `Artifact level is capped at ${cap}.` }
  if (!upgrade || !canUpgradeArtifact({ ...state, debug: { ...state.debug, artifactFreeUpgrade: free } }, id)) return { ok: false, reason: 'Not enough legal upgrade materials.' }
  if (!free) upgrade.ingredients.forEach(({ itemId, quantity }) => { state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) - quantity) })
  progress.level = upgrade.toLevel
  return { ok: true, itemId: id }
}
export const cancelArtificingCraft = (state: GameState) => { const job = active(state); if (!job) return false; const ingredients = getArtificingCraftIngredients(job.kind === 'recipe' ? job.recipeId : job.artifactId); ingredients?.forEach(({ itemId, quantity }) => grantItem(state, itemId, quantity)); clear(state); return true }
export const advanceArtificing = (state: GameState, deltaMs: number, onComplete?: (completion: ArtificingCompletion) => void) => {
  const job = active(state); if (!job || deltaMs <= 0) return null; state.activities.artificing.progressMs = Math.min(5000, Math.max(0, state.activities.artificing.progressMs + deltaMs)); if (state.activities.artificing.progressMs < 5000) return null
  let completion: ArtificingCompletion
  if (job.kind === 'artifact-forge') { if (!completeArtifactForge(state, job.artifactId)) { clear(state); return null }; completion = { kind: 'artifact-forge', recipeId: job.artifactId as ArtificingRecipeId, artifactId: job.artifactId, itemId: job.artifactId } }
  else { const itemId = ARTIFICING_RECIPES[job.recipeId].output.itemId; grantItem(state, itemId, 1); completion = { kind: 'recipe', recipeId: job.recipeId, itemId, quantity: 1 } }
  clear(state); onComplete?.(completion); return { ok: true, completion } as const
}
export const craftArtificingRecipe = startArtificingCraft
