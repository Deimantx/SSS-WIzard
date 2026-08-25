import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui'
import { SearchInput } from '../../components/ui'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { useGameStore } from '../../store/gameStore'
import { InventoryDetail } from './InventoryDetail'
import { InventoryItemTile } from './InventoryItemTile'
import { INVENTORY_FILTERS, INVENTORY_SORTS, inventorySummary, selectVisibleItemIds, type InventoryFilter, type InventorySort } from './inventorySelectors'

export function InventoryScreenV2() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<InventoryFilter>('All')
  const [sort, setSort] = useState<InventorySort>('Category')
  const [selected, setSelected] = useState<import('../../game/types').ItemId | null>(null)
  const inventory = useGameStore((state) => state.inventory)
  const protectedItems = useGameStore((state) => state.protectedItems)
  const equipment = useGameStore((state) => state.equipment)
  const toggleProtection = useGameStore((state) => state.toggleItemProtection)
  const equipItem = useGameStore((state) => state.equipItem)
  const visibleIds = useMemo(() => selectVisibleItemIds(inventory, protectedItems, equipment, search, filter, sort), [inventory, protectedItems, equipment, search, filter, sort])
  const summary = useMemo(() => inventorySummary(visibleIds, inventory), [visibleIds, inventory])

  useEffect(() => {
    setSelected((current) => current && visibleIds.includes(current) ? current : visibleIds[0] ?? null)
  }, [visibleIds.join('|')])

  const noMatchText = search.trim() ? `No items match "${search.trim()}".` : 'No items match this view.'
  const catalog = <Card title="Item Vault" action={<span className="muted">{summary.types} item types · {summary.total} total</span>}><div className="inventory-toolbar"><div className="inventory-search"><Search size={15} /><SearchInput value={search} onChange={setSearch} placeholder="Search owned items" /></div><div className="inventory-filter-bar" role="tablist" aria-label="Inventory filters">{INVENTORY_FILTERS.map((value) => <button type="button" role="tab" aria-selected={filter === value} className={filter === value ? 'active' : ''} key={value} onClick={() => setFilter(value)}>{value}</button>)}</div><label className="inventory-sort">Sort<select value={sort} onChange={(event) => setSort(event.target.value as InventorySort)}>{INVENTORY_SORTS.map((value) => <option key={value}>{value}</option>)}</select></label></div>{visibleIds.length > 0 ? <div className="inventory-grid">{visibleIds.map((id) => <InventoryItemTile key={id} itemId={id} inventory={inventory} protectedItems={protectedItems} equipment={equipment} selected={selected === id} onSelect={() => setSelected(id)} />)}</div> : <div className="inventory-empty-state"><strong>{noMatchText}</strong><span>Inventory shows items currently owned by the tower.</span></div>}</Card>
  const detailPanel = <Card title="Item Details">{selected ? <InventoryDetail itemId={selected} inventory={inventory} protectedItems={protectedItems} equipment={equipment} toggleProtection={toggleProtection} equipItem={equipItem} /> : <div className="inventory-detail-empty"><strong>{noMatchText}</strong><span>Try another filter or search term.</span></div>}</Card>
  return <div className="screen-content"><div className="screen-header"><div><div className="eyebrow">TOWER VAULT · INVENTORY</div><h1>Everything the tower currently holds.</h1><p>Inspect owned materials and equipment, protect important resources, and see exactly where each item belongs in the tower.</p></div></div><EditableGrid screen="inventory" panels={[{ id: 'inventory-catalog', content: catalog }, { id: 'inventory-detail', content: detailPanel }]} /></div>
}
