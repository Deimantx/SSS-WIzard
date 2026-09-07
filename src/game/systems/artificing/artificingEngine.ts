import { ARTIFICING_RECIPES } from '../../content/recipes/artificingRecipes'
import { ITEMS } from '../../content/items/items'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { grantItem } from '../inventory/itemAcquisition'
import { ARTIFACTS } from '../../content/artifacts/artifacts'
import { isRecipeUnlocked, getRecipeUnlockRequirement } from '../../content/recipes/recipeUnlocks'
import { canUpgradeArtifact, getArtifactProgress, getArtifactUpgrade, getArtifactLevelCap, completeArtifactForge } from '../artifacts/artifactProgression'
import type { ArtificingRecipeId, ArtifactId, GameState, ItemId } from '../../types'
export type ArtificingCraftResult = { ok: true; itemId: ItemId } | { ok: false; reason: string }
export type ArtificingCompletion =
  | { kind: 'recipe'; itemId: ItemId; quantity: 1 }
  | { kind: 'artifact-forge'; artifactId: ArtifactId; itemId: ItemId }
  | { kind: 'artifact-upgrade'; artifactId: ArtifactId; fromLevel: number; toLevel: number }
const active = (state: GameState) => state.activities.artificing.activeJob ?? (state.activities.artificing.activeRecipeId ? { kind: 'recipe' as const, recipeId: state.activities.artificing.activeRecipeId } : null)
const clear = (state: GameState) => { state.activities.artificing = { activeJob: null, activeRecipeId: null, progressMs: 0 } }
const ingredientsFor = (id: ArtificingRecipeId) => ARTIFACTS[id]?.forge.ingredients ?? ARTIFICING_RECIPES[id]?.ingredients
export const canCraftArtificingRecipe = (state: Pick<GameState, 'progress' | 'inventory' | 'protectedItems' | 'equipment' | 'activities' | 'artifactProgress'>, id: ArtificingRecipeId) => Boolean(ARTIFICING_RECIPES[id] && isRecipeUnlocked(state, ARTIFICING_RECIPES[id]) && !active(state as GameState) && !(ARTIFACTS[id] && (state.inventory[id] ?? 0) > 0) && ingredientsFor(id)?.every(i => getConsumableQuantity(state, i.itemId) >= i.quantity))
export const startArtificingCraft = (state: GameState, id: ArtificingRecipeId): ArtificingCraftResult => {
  const recipe = ARTIFICING_RECIPES[id]; const ingredients = ingredientsFor(id)
  if (!recipe || ITEMS[recipe.output.itemId]?.kind !== 'equipment') return { ok: false, reason: 'Unknown Artificing recipe.' }
  if (active(state)) return { ok: false, reason: 'Another Artificing job is already in progress.' }
  if (!isRecipeUnlocked(state, recipe)) return { ok: false, reason: getRecipeUnlockRequirement(recipe) ?? 'This recipe is locked.' }
  if (ARTIFACTS[id] && (state.inventory[id] ?? 0) > 0) return { ok: false, reason: 'This Artifact can only be forged once.' }
  if (!ingredients?.every(i => getConsumableQuantity(state, i.itemId) >= i.quantity)) return { ok: false, reason: 'Not enough legal ingredients.' }
  ingredients.forEach(({ itemId, quantity }) => { state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) - quantity) })
  state.activities.artificing = { activeJob: ARTIFACTS[id] ? { kind: 'artifact-forge', artifactId: id } : { kind: 'recipe', recipeId: id }, activeRecipeId: ARTIFACTS[id] ? null : id, progressMs: 0 }
  return { ok: true, itemId: recipe.output.itemId }
}
export const startArtifactUpgrade = (state: GameState, id: ArtifactId): ArtificingCraftResult => {
  if (!ARTIFACTS[id]) return { ok: false, reason: 'Artifact is not owned.' }
  const progress = state.artifactProgress?.[id]
  if (!progress) return { ok: false, reason: 'Artifact progression is missing or invalid.' }
  const upgrade = getArtifactUpgrade(id, progress.level); const cap = getArtifactLevelCap(state, id)
  if ((state.inventory[id] ?? 0) < 1) return { ok: false, reason: 'Artifact is not owned.' }
  if (active(state)) return { ok: false, reason: 'Another Artificing job is already in progress.' }
  if (progress.level >= cap) return { ok: false, reason: `Artifact level is capped at ${cap}.` }
  if (!upgrade || !canUpgradeArtifact(state, id)) return { ok: false, reason: 'Not enough legal upgrade materials.' }
  upgrade.ingredients.forEach(({ itemId, quantity }) => { state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) - quantity) })
  state.activities.artificing = { activeJob: { kind: 'artifact-upgrade', artifactId: id, fromLevel: progress.level, toLevel: upgrade.toLevel }, activeRecipeId: null, progressMs: 0 }
  return { ok: true, itemId: id }
}
export const cancelArtificingCraft = (state: GameState) => { const job = active(state); if (!job) return false; const ingredients = job.kind === 'recipe' ? ARTIFICING_RECIPES[job.recipeId]?.ingredients : job.kind === 'artifact-forge' ? ARTIFACTS[job.artifactId]?.forge.ingredients : getArtifactUpgrade(job.artifactId, job.fromLevel)?.ingredients; ingredients?.forEach(({ itemId, quantity }) => grantItem(state, itemId, quantity)); clear(state); return true }
export const advanceArtificing = (state: GameState, deltaMs: number, onComplete?: (completion: ArtificingCompletion) => void) => {
  const job = active(state); if (!job || deltaMs <= 0) return null; state.activities.artificing.progressMs = Math.min(5000, Math.max(0, state.activities.artificing.progressMs + deltaMs)); if (state.activities.artificing.progressMs < 5000) return null
  let completion: ArtificingCompletion
  if (job.kind === 'artifact-forge') { if (!completeArtifactForge(state, job.artifactId)) { clear(state); return null }; completion = { kind: 'artifact-forge', artifactId: job.artifactId, itemId: job.artifactId } }
  else if (job.kind === 'artifact-upgrade') { const progress = state.artifactProgress[job.artifactId]; if (!progress || progress.level !== job.fromLevel) { clear(state); return null }; progress.level = job.toLevel; completion = { kind: 'artifact-upgrade', artifactId: job.artifactId, fromLevel: job.fromLevel, toLevel: job.toLevel } }
  else { const itemId = ARTIFICING_RECIPES[job.recipeId].output.itemId; grantItem(state, itemId, 1); completion = { kind: 'recipe', itemId, quantity: 1 } }
  clear(state); onComplete?.(completion); return { ok: true, completion } as const
}
export const craftArtificingRecipe = startArtificingCraft
