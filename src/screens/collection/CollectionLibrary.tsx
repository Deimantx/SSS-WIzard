import { Search } from 'lucide-react'
import { Card, SearchInput } from '../../components/ui'
import { CollectionItemCard } from './CollectionItemCard'
import { getCollectionVisibleItems, isItemDiscovered, type CollectionCategoryFilter, type CollectionStatusFilter } from '../../game/systems/collection/collectionSelectors'
import { ITEMS } from '../../game/content/items/items'
import type { GameState, ItemId } from '../../game/types'

const categories: CollectionCategoryFilter[] = ['All', 'Materials', 'Loot', 'Equipment', 'Special']
const statuses: CollectionStatusFilter[] = ['All', 'Discovered', 'Undiscovered']

export function CollectionLibrary({ progress, inventory, search, category, status, onSearch, onCategory, onStatus, selected, onSelect }: { progress: GameState['progress']; inventory: GameState['inventory']; search: string; category: CollectionCategoryFilter; status: CollectionStatusFilter; onSearch: (value: string) => void; onCategory: (value: CollectionCategoryFilter) => void; onStatus: (value: CollectionStatusFilter) => void; selected: ItemId | null; onSelect: (itemId: ItemId) => void }) {
  const ids = getCollectionVisibleItems({ progress }, category, status, search)
  return <Card title="ITEM COLLECTION" className="collection-library"><div className="collection-toolbar"><div className="collection-search"><Search size={15} aria-hidden="true" /><SearchInput value={search} onChange={onSearch} placeholder="Search discovered items..." /></div><label className="collection-status-filter">Status<select aria-label="Collection discovery status" value={status} onChange={(event) => onStatus(event.target.value as CollectionStatusFilter)}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label></div><div className="collection-category-bar" role="tablist" aria-label="Collection categories">{categories.map((value) => <button type="button" role="tab" aria-selected={category === value} className={category === value ? 'active' : ''} key={value} onClick={() => onCategory(value)}>{value === 'All' ? 'ALL' : value.toUpperCase()}</button>)}</div>{ids.length === 0 ? <div className="collection-empty"><strong>No archive entries match this view.</strong><span>Discover items by obtaining them once.</span></div> : <div className="collection-item-grid">{ids.map((itemId) => <CollectionItemCard key={itemId} itemId={itemId} discovered={isItemDiscovered({ progress }, itemId)} quantity={inventory[itemId] ?? 0} selected={selected === itemId} onSelect={() => onSelect(itemId)} />)}</div>}<small className="collection-library-note">{ids.length} of {Object.keys(ITEMS).length} authored item types · categories follow Inventory function.</small></Card>
}
