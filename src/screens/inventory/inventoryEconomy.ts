import { GUILD_REQUESTS } from '../../game/content/guild/guildRequests'
import { MANA_PILLARS, getManaPillarLevelCost } from '../../game/content/channeling/manaPillars'
import { RECIPES } from '../../game/content/recipes/recipes'
import { SCHOOLS } from '../../game/content/schools/schools'
import { BALANCE } from '../../game/core/balance/balance'
import { ITEMS } from '../../game/content/items/items'
import type { GameState, ItemId, ScreenId } from '../../game/types'

export type ItemEconomyState = Pick<GameState, 'inventory' | 'protectedItems' | 'equipment' | 'progress' | 'activities'>
export type ItemFlowDirection = 'production' | 'consumption' | 'mixed'

export interface ItemFlowSource {
  label: string
  ratePerHour: number
  destination: ScreenId
}

export interface ItemFlow {
  itemId: ItemId
  production: ItemFlowSource[]
  consumption: ItemFlowSource[]
  productionPerHour: number
  consumptionPerHour: number
  netPerHour: number
  direction: ItemFlowDirection | null
  depletionEtaMs: number | null
}

export type ItemNeedStatus = 'READY' | 'MISSING' | 'PROTECTED'

export interface ItemNeed {
  id: string
  label: string
  detail: string
  destination: ScreenId
  owned: number
  required: number
  missing: number
  status: ItemNeedStatus
  readyInMs: number | null
}

const HOUR_MS = 3_600_000
const finitePositive = (value: number) => Number.isFinite(value) && value > 0 ? value : 0
const isProtected = (state: Pick<GameState, 'protectedItems' | 'equipment'>, itemId: ItemId) => Boolean(state.protectedItems[itemId]) || Object.values(state.equipment).includes(itemId)

const flowSource = (label: string, ratePerHour: number, destination: ScreenId): ItemFlowSource | null => {
  const rate = finitePositive(ratePerHour)
  return rate > 0 ? { label, ratePerHour: rate, destination } : null
}

/** Derives live material throughput from the same activity cycle values used by the game systems. */
export function getItemFlow(itemId: ItemId, state: Pick<GameState, 'inventory' | 'activities'>): ItemFlow | null {
  const item = ITEMS[itemId]
  if (!item || item.inventoryCategory !== 'material') return null

  const production: ItemFlowSource[] = []
  const consumption: ItemFlowSource[] = []
  const condense = state.activities.condense
  const school = Object.values(SCHOOLS).find((candidate) => candidate.fragment === itemId)
  if (condense.running && school && condense.element === school.id) {
    const source = flowSource('Condensation', HOUR_MS / BALANCE.condense.durationMs, 'tower-condensation')
    if (source) production.push(source)
  }

  const research = state.activities.research
  if (research.running && research.itemId === itemId && research.remainingQuantity > 0) {
    const source = flowSource('Research', HOUR_MS / Math.max(1, research.durationPerItemMs), 'tower-research')
    if (source) consumption.push(source)
  }

  const transmutation = state.activities.transmutation
  const recipe = transmutation.running && transmutation.recipeId ? RECIPES[transmutation.recipeId] : null
  const ingredient = recipe?.ingredients.find((candidate) => candidate.itemId === itemId)
  if (recipe && ingredient) {
    const source = flowSource('Transmutation', ingredient.quantity * HOUR_MS / Math.max(1, recipe.durationMs), 'tower-transmutation')
    if (source) consumption.push(source)
  }

  if (production.length === 0 && consumption.length === 0) return null
  const productionPerHour = production.reduce((sum, source) => sum + source.ratePerHour, 0)
  const consumptionPerHour = consumption.reduce((sum, source) => sum + source.ratePerHour, 0)
  const netPerHour = productionPerHour - consumptionPerHour
  const direction: ItemFlowDirection | null = productionPerHour > 0 && consumptionPerHour > 0 ? 'mixed' : productionPerHour > 0 ? 'production' : 'consumption'
  const quantity = Math.max(0, state.inventory[itemId] ?? 0)
  return { itemId, production, consumption, productionPerHour, consumptionPerHour, netPerHour, direction, depletionEtaMs: netPerHour < 0 && quantity > 0 ? quantity / Math.abs(netPerHour) * HOUR_MS : null }
}

const need = (id: string, label: string, detail: string, destination: ScreenId, itemId: ItemId, required: number, state: ItemEconomyState, flow: ItemFlow | null): ItemNeed => {
  const owned = Math.max(0, state.inventory[itemId] ?? 0)
  const safeRequired = Math.max(0, Math.floor(required))
  const missing = Math.max(0, safeRequired - owned)
  const protectedEnough = isProtected(state, itemId) && owned >= safeRequired
  const status: ItemNeedStatus = protectedEnough ? 'PROTECTED' : owned >= safeRequired ? 'READY' : 'MISSING'
  const readyInMs = status === 'MISSING' && flow && flow.netPerHour > 0 ? missing / flow.netPerHour * HOUR_MS : null
  return { id, label, detail, destination, owned, required: safeRequired, missing, status, readyInMs }
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

  if (state.progress.emberStaffUnlocked) {
    for (const recipe of Object.values(RECIPES)) {
      const ingredient = recipe.ingredients.find((candidate) => candidate.itemId === itemId)
      if (!ingredient) continue
      needs.push(need(`recipe:${recipe.id}`, recipe.name, 'Transmutation recipe', 'tower-transmutation', itemId, ingredient.quantity, state, flow))
    }
  }

  if (state.progress.guildUnlocked) {
    for (const request of Object.values(GUILD_REQUESTS)) {
      if (request.kind !== 'donation' || request.itemId !== itemId) continue
      const progress = Math.max(0, state.progress.requestProgress[request.id] ?? 0)
      const remaining = Math.max(0, request.target - progress)
      if (remaining > 0) needs.push(need(`guild:${request.id}`, request.name, 'Active Guild donation', 'guild', itemId, remaining, state, flow))
    }
  }

  return needs.slice(0, 5)
}

export function getNeededItemIds(state: ItemEconomyState): ItemId[] {
  return (Object.keys(ITEMS) as ItemId[]).filter((itemId) => (state.inventory[itemId] ?? 0) > 0 && getItemNeeds(itemId, state).length > 0)
}

export function formatItemFlowRate(ratePerHour: number) {
  const rounded = Math.abs(ratePerHour) >= 100 ? Math.round(Math.abs(ratePerHour)) : Math.round(Math.abs(ratePerHour) * 10) / 10
  return `${ratePerHour >= 0 ? '+' : '-'}${rounded.toLocaleString()}/h`
}

export function formatFlowEta(durationMs: number | null) {
  if (durationMs === null || !Number.isFinite(durationMs)) return null
  const rawMinutes = Math.max(0, durationMs / 60_000)
  if (rawMinutes < 1) return '<1m'
  const totalMinutes = Math.ceil(rawMinutes)
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}
