import { ITEMS } from '../../game/content/items/items'
import type { GameState, ItemCategory, ItemId } from '../../game/types'

export const INVENTORY_FILTERS = ['All', 'Elemental', 'Monster Loot', 'Equipment', 'Boss Loot', 'Protected'] as const
export type InventoryFilter = typeof INVENTORY_FILTERS[number]
export const INVENTORY_SORTS = ['Category', 'Name', 'Quantity'] as const
export type InventorySort = typeof INVENTORY_SORTS[number]
const categoryForFilter: Record<Exclude<InventoryFilter, 'Protected'>, ItemCategory | null> = { All: null, Elemental: 'elemental', 'Monster Loot': 'monster-loot', Equipment: 'equipment', 'Boss Loot': 'boss-loot' }

export function selectOwnedItemIds(inventory: GameState['inventory']) { return (Object.keys(ITEMS) as ItemId[]).filter((id) => (inventory[id] ?? 0) > 0) }

export function selectVisibleItemIds(inventory: GameState['inventory'], protectedItems: GameState['protectedItems'], equipment: GameState['equipment'], search: string, filter: InventoryFilter, sort: InventorySort) {
  const normalized = search.trim().toLowerCase()
  const equipped = new Set(Object.values(equipment).filter(Boolean))
  const items = selectOwnedItemIds(inventory).filter((id) => {
    const item = ITEMS[id]
    const categoryMatch = filter === 'Protected' ? Boolean(protectedItems[id]) || equipped.has(id) : !categoryForFilter[filter] || item.category === categoryForFilter[filter]
    return categoryMatch && (!normalized || item.name.toLowerCase().includes(normalized))
  })
  return items.sort((a, b) => {
    if (sort === 'Quantity') return (inventory[b] ?? 0) - (inventory[a] ?? 0) || ITEMS[a].name.localeCompare(ITEMS[b].name)
    if (sort === 'Name') return ITEMS[a].name.localeCompare(ITEMS[b].name)
    return ITEMS[a].category.localeCompare(ITEMS[b].category) || ITEMS[a].name.localeCompare(ITEMS[b].name)
  })
}

export function inventorySummary(ids: ItemId[], inventory: GameState['inventory']) { return { types: ids.length, total: ids.reduce((sum, id) => sum + Math.max(0, inventory[id] ?? 0), 0) } }
