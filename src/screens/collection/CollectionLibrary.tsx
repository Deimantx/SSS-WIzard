import { Search } from 'lucide-react'
import { Card, FilterBar, SearchInput, type FilterOption } from '../../components/ui'
import { CollectionItemCard } from './CollectionItemCard'
import { getCollectionItems, getCollectionVisibleItems, isItemDiscovered, type CollectionCategoryFilter, type CollectionStatusFilter } from '../../game/systems/collection/collectionSelectors'
import { INVENTORY_CATEGORIES } from '../../game/content/items/inventoryMetadata'
import type { GameState, ItemId } from '../../game/types'

const categories: FilterOption<CollectionCategoryFilter>[] = INVENTORY_CATEGORIES.map((value) => ({ value, label: value.toUpperCase() }))
const statuses: FilterOption<CollectionStatusFilter>[] = [{ value: 'All', label: 'ALL' }, { value: 'Discovered', label: 'DISCOVERED' }, { value: 'Undiscovered', label: 'UNDISCOVERED' }]

interface CollectionLibraryProps {
  progress: GameState['progress']
  inventory: GameState['inventory']
  search: string
  category: CollectionCategoryFilter
  status: CollectionStatusFilter
  onSearch: (value: string) => void
  onCategory: (value: CollectionCategoryFilter) => void
  onStatus: (value: CollectionStatusFilter) => void
  selected: ItemId | null
  newItems?: ReadonlySet<ItemId>
  onSelect: (itemId: ItemId) => void
}

export function CollectionLibrary({ progress, inventory, search, category, status, onSearch, onCategory, onStatus, selected, newItems = new Set<ItemId>(), onSelect }: CollectionLibraryProps) {
  const ids = getCollectionVisibleItems({ progress }, category, status, search)
  return <Card title="ITEM COLLECTION" className="collection-library"><div className="archive-search collection-search"><Search size={15} aria-hidden="true" /><SearchInput ariaLabel="Search collection" value={search} onChange={onSearch} placeholder="Search collection..." /></div><FilterBar options={categories} value={category} onChange={onCategory} ariaLabel="Collection categories" /><div className="collection-discovery-filter"><span>SHOW</span><FilterBar options={statuses} value={status} onChange={onStatus} ariaLabel="Collection discovery status" /></div>{ids.length === 0 ? <div className="collection-empty"><strong>No archive entries match this view.</strong><span>Discover items by obtaining them once.</span></div> : <div className="archive-entry-grid collection-item-grid">{ids.map((itemId) => <CollectionItemCard key={itemId} itemId={itemId} discovered={isItemDiscovered({ progress }, itemId)} quantity={inventory[itemId] ?? 0} selected={selected === itemId} newItem={newItems.has(itemId)} onSelect={() => onSelect(itemId)} />)}</div>}<small className="collection-library-note">Showing {ids.length} of {getCollectionItems().length} entries</small></Card>
}
