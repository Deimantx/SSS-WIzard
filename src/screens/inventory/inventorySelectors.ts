import { ITEMS } from '../../game/content/items/items'
import type { GameState, ItemId } from '../../game/types'
import { getInventoryCategory, getMaterialSubtype, INVENTORY_CATEGORIES, matchesInventorySearch, MATERIAL_SUBCATEGORIES, type InventoryCategoryFilter, type MaterialSubcategoryFilter } from './inventoryMetadata'

export { INVENTORY_CATEGORIES, MATERIAL_SUBCATEGORIES }
export const INVENTORY_FILTERS = INVENTORY_CATEGORIES
export const INVENTORY_UTILITY_FILTERS = ['Protected', 'Needed'] as const
export type InventoryFilter = InventoryCategoryFilter | typeof INVENTORY_UTILITY_FILTERS[number] | 'Elemental' | 'Monster Loot' | 'Boss Loot'
export const INVENTORY_SORTS = ['Category', 'Name', 'Quantity', 'Recent'] as const
export type InventorySort = typeof INVENTORY_SORTS[number]

const categoryFilterMatches = (id: ItemId, filter: InventoryFilter, materialSubcategory: MaterialSubcategoryFilter) => {
  const item = ITEMS[id]
  if (filter === 'Elemental') return item.inventoryCategory === 'material' && item.materialSubtype === 'elemental'
  if (filter === 'Monster Loot') return item.category === 'monster-loot'
  if (filter === 'Boss Loot') return item.category === 'boss-loot'
  if (filter === 'All' || filter === 'Protected' || filter === 'Needed') return true
  if (filter === 'Materials') return item.inventoryCategory === 'material' && (materialSubcategory === 'All Materials' || item.materialSubtype === materialSubcategory.toLowerCase())
  return getInventoryCategory(id) === filter.toLowerCase() as 'loot' | 'equipment' | 'special'
}

export function selectOwnedItemIds(inventory: GameState['inventory']) {
  return (Object.keys(ITEMS) as ItemId[]).filter((id) => (inventory[id] ?? 0) > 0)
}

export function selectVisibleItemIds(
  inventory: GameState['inventory'],
  protectedItems: GameState['protectedItems'],
  equipment: GameState['equipment'],
  search: string,
  filter: InventoryFilter,
  sort: InventorySort,
  materialSubcategory: MaterialSubcategoryFilter | readonly ItemId[] = 'All Materials',
  recentOrder: readonly ItemId[] = [],
  neededItemIds: readonly ItemId[] = [],
) {
  const isRecentArray = Array.isArray(materialSubcategory)
  const resolvedSubcategory: MaterialSubcategoryFilter = isRecentArray ? 'All Materials' : materialSubcategory as MaterialSubcategoryFilter
  const resolvedRecentOrder: readonly ItemId[] = isRecentArray ? materialSubcategory as readonly ItemId[] : recentOrder
  const equipped = new Set(Object.values(equipment).filter(Boolean))
  const needed = new Set(neededItemIds)
  const recentRank = new Map(resolvedRecentOrder.map((id, index) => [id, index]))
  const items = selectOwnedItemIds(inventory).filter((id) => {
    const protectionMatch = filter === 'Protected' ? Boolean(protectedItems[id]) || equipped.has(id) : true
    const neededMatch = filter === 'Needed' ? needed.has(id) : true
    return protectionMatch && neededMatch && categoryFilterMatches(id, filter, resolvedSubcategory) && matchesInventorySearch(id, search)
  })
  return items.sort((a, b) => {
    if (sort === 'Quantity') return (inventory[b] ?? 0) - (inventory[a] ?? 0) || ITEMS[a].name.localeCompare(ITEMS[b].name)
    if (sort === 'Name') return ITEMS[a].name.localeCompare(ITEMS[b].name)
    if (sort === 'Recent') return (recentRank.get(a) ?? Number.MAX_SAFE_INTEGER) - (recentRank.get(b) ?? Number.MAX_SAFE_INTEGER) || ITEMS[a].name.localeCompare(ITEMS[b].name)
    const categoryOrder = { material: 0, loot: 1, equipment: 2, special: 3 } as const
    return categoryOrder[getInventoryCategory(a)] - categoryOrder[getInventoryCategory(b)] || ITEMS[a].name.localeCompare(ITEMS[b].name)
  })
}

export function groupOwnedItemIds(ids: readonly ItemId[]) {
  return (['material', 'loot', 'equipment', 'special'] as const).map((category) => ({ category, ids: ids.filter((id) => getInventoryCategory(id) === category) })).filter((group) => group.ids.length > 0)
}

export function inventorySummary(ids: readonly ItemId[], inventory: GameState['inventory']) {
  return { types: ids.filter((id) => (inventory[id] ?? 0) > 0).length, total: ids.reduce((sum, id) => sum + Math.max(0, inventory[id] ?? 0), 0) }
}

export function materialSubcategoryCount(ids: readonly ItemId[], subtype: Exclude<MaterialSubcategoryFilter, 'All Materials'>) {
  return ids.filter((id) => getMaterialSubtype(id) === subtype.toLowerCase()).length
}
