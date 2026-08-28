import { RECIPES } from '../../content/recipes/recipes'
import { ITEMS } from '../../content/items/items'
import { getRecipeCraftsPerHour, isRecipeUnlocked } from '../transmutation/transmutationSelectors'
import type { GameState, ItemId, ScreenId } from '../../types'
import { getPreparedResearchJobs, getResearchItemsPerHour } from '../research/researchSelectors'

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

const HOUR_MS = 3_600_000
const finitePositive = (value: number) => Number.isFinite(value) && value > 0 ? value : 0

const flowSource = (label: string, ratePerHour: number, destination: ScreenId): ItemFlowSource | null => {
  const rate = finitePositive(ratePerHour)
  return rate > 0 ? { label, ratePerHour: rate, destination } : null
}

/** Derives live material throughput from the same activity cycle values used by the game systems. */
export function getItemFlow(itemId: ItemId, state: Pick<GameState, 'inventory' | 'activities' | 'progress'>): ItemFlow | null {
  const item = ITEMS[itemId]
  if (!item || item.inventoryCategory !== 'material') return null

  const production: ItemFlowSource[] = []
  const consumption: ItemFlowSource[] = []
  const researchRate = getPreparedResearchJobs(state)
    .filter((job) => job.itemId === itemId && job.echoesAssigned > 0)
    .reduce((total, job) => total + getResearchItemsPerHour(job), 0)
  const researchSource = flowSource('Research', researchRate, 'tower-research')
  if (researchSource) consumption.push(researchSource)

  Object.values(RECIPES).forEach((recipe) => {
    const echoes = Math.max(0, Math.floor(state.activities.transmutation.jobs[recipe.id]?.echoesAssigned ?? 0))
    if (!echoes || !isRecipeUnlocked(state, recipe)) return
    const ingredient = recipe.ingredients.find((candidate) => candidate.itemId === itemId)
    if (ingredient) {
      const source = flowSource(recipe.name, ingredient.quantity * getRecipeCraftsPerHour(recipe, echoes), 'tower-transmutation')
      if (source) consumption.push(source)
    }
    const output = recipe.output.itemId === itemId ? flowSource(recipe.name, recipe.output.quantity * getRecipeCraftsPerHour(recipe, echoes), 'tower-transmutation') : null
    if (output) production.push(output)
  })

  if (production.length === 0 && consumption.length === 0) return null
  const productionPerHour = production.reduce((sum, source) => sum + source.ratePerHour, 0)
  const consumptionPerHour = consumption.reduce((sum, source) => sum + source.ratePerHour, 0)
  const netPerHour = productionPerHour - consumptionPerHour
  const direction: ItemFlowDirection | null = productionPerHour > 0 && consumptionPerHour > 0 ? 'mixed' : productionPerHour > 0 ? 'production' : 'consumption'
  const quantity = Math.max(0, state.inventory[itemId] ?? 0)
  return { itemId, production, consumption, productionPerHour, consumptionPerHour, netPerHour, direction, depletionEtaMs: netPerHour < 0 && quantity > 0 ? quantity / Math.abs(netPerHour) * HOUR_MS : null }
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
