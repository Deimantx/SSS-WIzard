import { ARCANE_REGISTRY_SETS } from '../../content/guild/registry/registrySets'
import { ITEMS } from '../../content/items/items'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { grantItem } from '../inventory/itemAcquisition'
import { pushNotification } from '../../engine'
import type { GameState, ItemId } from '../../types'
import { getGuildProgressionBonuses } from './guildSelectors'
import { grantGuildReputation } from './guildReputation'

const safeInt = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))
export const getArcaneRegistryEntries = () => Object.values(ITEMS).map((item) => ({ item, category: item.registryCategory ?? 'Other', mode: item.registryMode ?? 'consume', quantity: Math.max(1, item.registryQuantity ?? 1) }))
export const getArcaneRegistryCategories = () => [...new Set(getArcaneRegistryEntries().map((entry) => entry.category))].sort((a, b) => a.localeCompare(b))
export const getArcaneRegistrySummary = (state: Pick<GameState, 'progress'>) => {
  const entries = getArcaneRegistryEntries()
  const registered = entries.filter(({ item }) => Boolean(state.progress.arcaneRegistry.registeredEntries[item.id])).length
  const totalSets = ARCANE_REGISTRY_SETS.length
  const completeSets = ARCANE_REGISTRY_SETS.filter((set) => state.progress.arcaneRegistry.completedSetIds.includes(set.id)).length
  return { registered, total: entries.length, percent: entries.length ? Math.round(registered / entries.length * 100) : 0, completeSets, totalSets }
}
export const getEffectiveArcaneRegistryQuantity = (state: Pick<GameState, 'progress'>, itemId: ItemId) => {
  const item = ITEMS[itemId]
  return item ? Math.max(1, Math.floor(Math.max(1, item.registryQuantity ?? 1) * getGuildProgressionBonuses(state).registryQuantityMultiplier)) : 1
}

const ownsEntry = (state: GameState, itemId: ItemId) => (state.inventory[itemId] ?? 0) > 0 || Object.values(state.equipment).includes(itemId as GameState['equipment'][keyof GameState['equipment']])
const canRegisterEntry = (state: GameState, itemId: ItemId) => {
  const item = ITEMS[itemId]
  if (!item || state.progress.arcaneRegistry.registeredEntries[itemId]) return false
  const mode = item.registryMode ?? 'consume'
  if (mode === 'discover') return state.progress.discoveredItems.includes(itemId)
  if (mode === 'own') return ownsEntry(state, itemId)
  return getConsumableQuantity(state, itemId) >= getEffectiveArcaneRegistryQuantity(state, itemId) && !state.protectedItems[itemId]
}
export const isArcaneRegistryEntryAvailable = (state: GameState, itemId: ItemId) => canRegisterEntry(state, itemId)

export const registerArcaneRegistryEntry = (state: GameState, itemId: ItemId) => {
  if (!state.progress.guildUnlocked || !canRegisterEntry(state, itemId)) return false
  const item = ITEMS[itemId]
  const quantity = getEffectiveArcaneRegistryQuantity(state, itemId)
  if ((item.registryMode ?? 'consume') === 'consume') {
    if (state.protectedItems[itemId] || getConsumableQuantity(state, itemId) < quantity) return false
    state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) - quantity)
  }
  state.progress.arcaneRegistry.registeredEntries[itemId] = quantity
  pushNotification(state, `${item.name} registered with the Arcane Guild.`, 'success')
  for (const set of ARCANE_REGISTRY_SETS) {
    if (state.progress.arcaneRegistry.completedSetIds.includes(set.id) || !set.entryIds.every((id) => Boolean(state.progress.arcaneRegistry.registeredEntries[id]))) continue
    state.progress.arcaneRegistry.completedSetIds.push(set.id)
    grantGuildReputation(state, set.reputationReward)
    state.progress.guildPointsEarned = safeInt(state.progress.guildPointsEarned) + set.advancementPointsReward
    pushNotification(state, `${set.name} completed · +${set.reputationReward} Reputation · +${set.advancementPointsReward} Advancement Point.`, 'success')
  }
  return true
}

export const debugCompleteRegistryEntry = (state: GameState, itemId: ItemId) => { const item = ITEMS[itemId]; if (!item || state.progress.arcaneRegistry.registeredEntries[itemId]) return false; const mode = item.registryMode ?? 'consume'; if (mode === 'discover') state.progress.discoveredItems = [...new Set([...state.progress.discoveredItems, itemId])]; else if (mode === 'own') grantItem(state, itemId, 1); else grantItem(state, itemId, Math.max(1, item.registryQuantity ?? 1)); return registerArcaneRegistryEntry(state, itemId) }
export const debugCompleteRegistrySet = (state: GameState, setId: string) => { const set = ARCANE_REGISTRY_SETS.find((entry) => entry.id === setId); if (!set) return false; for (const itemId of set.entryIds) if (!state.progress.arcaneRegistry.registeredEntries[itemId]) debugCompleteRegistryEntry(state, itemId); return state.progress.arcaneRegistry.completedSetIds.includes(setId) }
export const debugResetRegistrySet = (state: GameState, setId: string) => {
  const set = ARCANE_REGISTRY_SETS.find((entry) => entry.id === setId)
  const itemId = set?.entryIds[set.entryIds.length - 1]
  if (!itemId || !state.progress.arcaneRegistry.registeredEntries[itemId]) return false
  delete state.progress.arcaneRegistry.registeredEntries[itemId]
  const invalidated = ARCANE_REGISTRY_SETS.filter((entry) => entry.entryIds.includes(itemId) && state.progress.arcaneRegistry.completedSetIds.includes(entry.id))
  state.progress.arcaneRegistry.completedSetIds = state.progress.arcaneRegistry.completedSetIds.filter((id) => !invalidated.some((entry) => entry.id === id))
  state.progress.guildPointsEarned = Math.max(0, state.progress.guildPointsEarned - invalidated.reduce((sum, entry) => sum + entry.advancementPointsReward, 0))
  return true
}
