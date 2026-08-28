import { ITEMS } from '../../content/items/items'
import type { GameState, InventoryCategory, ItemId } from '../../types'
import { CATEGORY_LABELS, INVENTORY_CATEGORIES, INVENTORY_CATEGORY_ORDER, getInventorySubcategoryLabel } from '../../content/items/inventoryMetadata'
import { completionPercent } from '../archive/archiveSelectors'

export type CollectionStatusFilter = 'All' | 'Discovered' | 'Undiscovered'
export type CollectionCategoryFilter = typeof INVENTORY_CATEGORIES[number]

export const isItemDiscovered = (state: Pick<GameState, 'progress'>, itemId: ItemId) => state.progress.discoveredItems.includes(itemId)

export const getCollectionItems = () => Object.keys(ITEMS) as ItemId[]

export const getCollectionCompletion = (state: Pick<GameState, 'progress'>) => {
  const total = getCollectionItems().length
  const discovered = getCollectionItems().filter((itemId) => isItemDiscovered(state, itemId)).length
  return { discovered, total, percent: completionPercent(discovered, total) }
}

export const getCollectionCategoryCounts = (state: Pick<GameState, 'progress'>) => Object.fromEntries(
  INVENTORY_CATEGORY_ORDER.map((category) => {
    const ids = getCollectionItems().filter((itemId) => ITEMS[itemId].inventoryCategory === category)
    return [category, { discovered: ids.filter((itemId) => isItemDiscovered(state, itemId)).length, total: ids.length }]
  }),
) as Record<InventoryCategory, { discovered: number; total: number }>

const categoryForFilter: Record<CollectionCategoryFilter, InventoryCategory | null> = { All: null, Materials: 'material', Loot: 'loot', Equipment: 'equipment', Special: 'special' }

const searchText = (itemId: ItemId) => {
  const item = ITEMS[itemId]
  return [item.name, item.description, item.inventoryCategory, CATEGORY_LABELS[item.inventoryCategory], getInventorySubcategoryLabel(itemId), item.category].filter(Boolean).join(' ').toLowerCase()
}

/** Unknown entries are deliberately excluded from text matching so their names cannot be searched into view. */
export const getCollectionVisibleItems = (state: Pick<GameState, 'progress'>, category: CollectionCategoryFilter = 'All', status: CollectionStatusFilter = 'All', query = '') => {
  const inventoryCategory = categoryForFilter[category]
  const normalizedQuery = query.trim().toLowerCase()
  return getCollectionItems().filter((itemId) => {
    const discovered = isItemDiscovered(state, itemId)
    if (inventoryCategory && ITEMS[itemId].inventoryCategory !== inventoryCategory) return false
    if (status === 'Discovered' && !discovered) return false
    if (status === 'Undiscovered' && discovered) return false
    if (normalizedQuery && (!discovered || !searchText(itemId).includes(normalizedQuery))) return false
    return true
  }).sort((left, right) => {
    const categoryOrder = INVENTORY_CATEGORY_ORDER.indexOf(ITEMS[left].inventoryCategory) - INVENTORY_CATEGORY_ORDER.indexOf(ITEMS[right].inventoryCategory)
    return categoryOrder || getCollectionItems().indexOf(left) - getCollectionItems().indexOf(right)
  })
}
