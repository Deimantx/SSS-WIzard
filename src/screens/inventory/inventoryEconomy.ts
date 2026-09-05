import { GUILD_REQUESTS } from '../../game/content/guild/guildRequests'
import { MANA_PILLARS, getManaPillarLevelCost } from '../../game/content/channeling/manaPillars'
import { FOCUS_IMPROVEMENT, getFocusImprovementLevelCost } from '../../game/content/focus/focusImprovement'
import { RECIPES } from '../../game/content/recipes/recipes'
import { ARTIFICING_RECIPES } from '../../game/content/recipes/artificingRecipes'
import { ITEMS } from '../../game/content/items/items'
import { isRecipeUnlocked } from '../../game/systems/transmutation/transmutationSelectors'
import { getItemFlow, type ItemFlow } from '../../game/systems/inventory/itemFlow'
import { getConsumableQuantity } from '../../game/core/inventory/inventoryConsumption'
import type { GameState, ItemId, ScreenId } from '../../game/types'

export type ItemEconomyState = Pick<GameState, 'inventory' | 'protectedItems' | 'equipment' | 'progress' | 'activities'>

export type ItemNeedStatus = 'READY' | 'MISSING' | 'PROTECTED'

export interface ItemNeed {
  id: string
  label: string
  detail: string
  destination: ScreenId
  owned: number
  available: number
  required: number
  missing: number
  status: ItemNeedStatus
  readyInMs: number | null
}

const HOUR_MS = 3_600_000
const isProtected = (state: Pick<GameState, 'protectedItems' | 'equipment'>, itemId: ItemId) => Boolean(state.protectedItems[itemId]) || Object.values(state.equipment).includes(itemId)

const need = (id: string, label: string, detail: string, destination: ScreenId, itemId: ItemId, required: number, state: ItemEconomyState, flow: ItemFlow | null): ItemNeed => {
  const owned = Math.max(0, state.inventory[itemId] ?? 0)
  const safeRequired = Math.max(0, Math.floor(required))
  const available = getConsumableQuantity(state, itemId)
  const missing = Math.max(0, safeRequired - available)
  const protectedEnough = isProtected(state, itemId) && owned >= safeRequired
  const status: ItemNeedStatus = protectedEnough ? 'PROTECTED' : owned >= safeRequired ? 'READY' : 'MISSING'
  const readyInMs = status === 'MISSING' && flow && flow.netPerHour > 0 ? missing / flow.netPerHour * HOUR_MS : null
  return { id, label, detail, destination, owned: available, available, required: safeRequired, missing, status, readyInMs }
}

/** Returns the small, actionable set of requirements relevant to this material now. */
export function getItemNeeds(itemId: ItemId, state: ItemEconomyState): ItemNeed[] {
  const item = ITEMS[itemId]
  if (!item || item.inventoryCategory !== 'material') return []
  const flow = getItemFlow(itemId, state)
  const needs: ItemNeed[] = []

  for (const pillar of Object.values(MANA_PILLARS)) {
    const currentLevel = Math.max(0, Math.floor(state.progress.channeling.pillars[pillar.id]?.level ?? 0))
    const nextLevel = currentLevel + 1
    const cost = getManaPillarLevelCost(nextLevel)
    if (!cost || !pillar.fragmentRequirements.includes(itemId)) continue
    needs.push(need(`pillar:${pillar.id}`, `${pillar.name} Lv.${nextLevel}`, 'Next Pillar level', 'tower-channeling', itemId, cost.fragment, state, flow))
  }

  if (state.progress.guildUnlocked) {
    for (const request of Object.values(GUILD_REQUESTS)) {
      if (request.kind !== 'donation' || request.itemId !== itemId) continue
      const progress = Math.max(0, state.progress.requestProgress[request.id] ?? 0)
      const remaining = Math.max(0, request.target - progress)
      if (remaining > 0) needs.push(need(`guild:${request.id}`, request.name, 'Active Guild donation', 'guild', itemId, remaining, state, flow))
    }
  }

  for (const recipe of Object.values(RECIPES)) {
    if (!isRecipeUnlocked(state, recipe)) continue
    const ingredient = recipe.ingredients.find((candidate) => candidate.itemId === itemId)
    if (!ingredient) continue
    needs.push(need(`recipe:${recipe.id}`, recipe.name, 'sourceDungeonId' in recipe ? 'Artificing recipe' : 'Transmutation recipe', 'sourceDungeonId' in recipe ? 'tower-artificing' : 'tower-transmutation', itemId, ingredient.quantity, state, flow))
  }

  const focusLevel = Math.max(0, Math.floor(state.progress.focusImprovement.level))
  const focusCost = getFocusImprovementLevelCost(focusLevel + 1)
  if (focusCost && itemId === 'prismatic-fragment') {
    needs.push(need(`focus:${FOCUS_IMPROVEMENT.id}`, `${FOCUS_IMPROVEMENT.name} Lv ${focusLevel + 1}`, 'Next Focus Capacity level', 'tower-focus', itemId, focusCost.primary, state, flow))
  }

  return needs
}

export function getNeededItemIds(state: ItemEconomyState, pinnedRecipeId: import('../../game/types').ArtificingRecipeId | null = null): ItemId[] {
  return (Object.keys(ITEMS) as ItemId[]).filter((itemId) => (state.inventory[itemId] ?? 0) > 0 && getPinnedArtificingItemNeed(itemId, state, pinnedRecipeId) !== null)
}

export function getPinnedArtificingItemNeed(itemId: ItemId, state: ItemEconomyState | undefined, pinnedRecipeId: import('../../game/types').ArtificingRecipeId | null): ItemNeed | null {
  if (!state || !pinnedRecipeId) return null
  const recipe = ARTIFICING_RECIPES[pinnedRecipeId]
  const ingredient = recipe?.ingredients.find(entry => entry.itemId === itemId)
  if (!recipe || !ingredient) return null
  return need(`pinned:${recipe.id}`, recipe.name, 'Pinned Artificing recipe', 'tower-artificing', itemId, ingredient.quantity, state, getItemFlow(itemId, state))
}
