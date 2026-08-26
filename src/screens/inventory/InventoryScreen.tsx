import { Check, Coins, LockKeyhole, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Card, SearchInput } from '../../components/ui'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { useGameStore } from '../../store/gameStore'
import type { ItemId } from '../../game/types'
import { CATEGORY_LABELS, INVENTORY_CATEGORIES, MATERIAL_SUBCATEGORIES, type MaterialSubcategoryFilter } from './inventoryMetadata'
import { groupOwnedItemIds, inventorySummary, materialSubcategoryCount, selectOwnedItemIds, selectVisibleItemIds, type InventoryFilter, type InventorySort, INVENTORY_SORTS } from './inventorySelectors'
import { InventoryDetail } from './InventoryDetail'
import { InventoryActions } from './InventoryActions'
import { InventoryItemTile } from './InventoryItemTile'
import { InventoryRecent } from './InventoryRecent'
import { getItemFlow, getNeededItemIds, type ItemEconomyState } from './inventoryEconomy'

export function InventoryScreenV2() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<InventoryFilter>('All')
  const [materialSubcategory, setMaterialSubcategory] = useState<MaterialSubcategoryFilter>('All Materials')
  const [sort, setSort] = useState<InventorySort>('Category')
  const [selected, setSelected] = useState<ItemId | null>(null)
  const [clearedNew, setClearedNew] = useState<Set<ItemId>>(() => new Set())
  const inventory = useGameStore((state) => state.inventory)
  const protectedItems = useGameStore((state) => state.protectedItems)
  const equipment = useGameStore((state) => state.equipment)
  const progress = useGameStore((state) => state.progress)
  const activities = useGameStore((state) => state.activities)
  const currencies = useGameStore((state) => state.currencies)
  const recentAcquisitions = useGameStore((state) => state.recentAcquisitions)
  const toggleProtection = useGameStore((state) => state.toggleItemProtection)
  const equipItem = useGameStore((state) => state.equipItem)
  const sellItem = useGameStore((state) => state.sellItem)
  const destroyItem = useGameStore((state) => state.destroyItem)
  const clearRecentNew = useGameStore((state) => state.clearRecentNew)
  const navigate = useGameStore((state) => state.setScreen)
  const ownedIds = useMemo(() => selectOwnedItemIds(inventory), [inventory])
  const recentOrder = useMemo(() => recentAcquisitions.map((entry) => entry.itemId), [recentAcquisitions])
  const economyState = useMemo<ItemEconomyState>(() => ({ inventory, protectedItems, equipment, progress, activities }), [inventory, protectedItems, equipment, progress, activities])
  const neededIds = useMemo(() => getNeededItemIds(economyState), [economyState])
  const flowById = useMemo(() => new Map(ownedIds.map((id) => [id, getItemFlow(id, economyState)])), [ownedIds, economyState])
  const visibleIds = useMemo(() => selectVisibleItemIds(inventory, protectedItems, equipment, search, filter, sort, materialSubcategory, recentOrder, neededIds), [inventory, protectedItems, equipment, search, filter, sort, materialSubcategory, recentOrder, neededIds])
  const summary = useMemo(() => inventorySummary(ownedIds, inventory), [ownedIds, inventory])
  const newItems = useMemo(() => new Set(recentAcquisitions.filter((entry) => entry.isNew && !clearedNew.has(entry.itemId)).map((entry) => entry.itemId)), [recentAcquisitions, clearedNew])

  useEffect(() => {
    setSelected((current) => current && visibleIds.includes(current) ? current : visibleIds[0] ?? null)
  }, [visibleIds.join('|')])

  const selectItem = (itemId: ItemId) => {
    setSelected(itemId)
    clearRecentNew(itemId)
    setClearedNew((current) => new Set(current).add(itemId))
    window.setTimeout(() => {
      const element = document.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`)
      if (element && typeof element.scrollIntoView === 'function') element.scrollIntoView({ behavior: document.documentElement.dataset.reducedMotion === 'true' ? 'auto' : 'smooth', block: 'nearest' })
    }, 0)
  }

  const selectRecent = (itemId: ItemId) => {
    setSearch('')
    setFilter('All')
    setMaterialSubcategory('All Materials')
    selectItem(itemId)
  }
  const setCategory = (next: InventoryFilter) => { setFilter(next); if (next !== 'Materials') setMaterialSubcategory('All Materials') }
  const noMatchText = search.trim() ? `No owned items match “${search.trim()}”.` : filter === 'Protected' ? 'No protected items are currently owned.' : filter === 'Needed' ? 'No owned items are needed right now.' : 'No owned items match this view.'

  const renderGrid = () => {
    if (visibleIds.length === 0) return <div className="inventory-empty-state"><div className="inventory-empty-mark">◇</div><strong>{noMatchText}</strong><span>Inventory shows only what the tower currently owns. Browse unowned discoveries in Collection.</span></div>
    const filteredCategory = filter === 'Materials' ? 'material' : filter === 'Loot' ? 'loot' : filter === 'Equipment' ? 'equipment' : 'special'
    const groups = filter === 'All' || filter === 'Protected' || filter === 'Needed' ? groupOwnedItemIds(visibleIds) : [{ category: filteredCategory as 'material' | 'loot' | 'equipment' | 'special', ids: visibleIds }]
    return <div className="inventory-groups">{groups.map((group) => <section className="inventory-group" key={group.category}><div className="inventory-group-heading"><span>{CATEGORY_LABELS[group.category]}</span><small>{group.ids.length} {group.ids.length === 1 ? 'TYPE' : 'TYPES'}</small></div><div className="inventory-grid">{group.ids.map((id) => <InventoryItemTile key={id} itemId={id} inventory={inventory} protectedItems={protectedItems} equipment={equipment} selected={selected === id} newItem={newItems.has(id)} flow={flowById.get(id)} flowDirection={flowById.get(id)?.direction ?? undefined} onSelect={() => selectItem(id)} />)}</div></section>)}</div>
  }

  const catalog = <Card title="ITEM VAULT" action={<span className="inventory-vault-header-meta"><span className="inventory-summary">{summary.types} ITEM TYPES <i>·</i> {summary.total.toLocaleString()} TOTAL ITEMS</span><span className="inventory-gold"><Coins size={14} /> GOLD {Math.max(0, Math.floor(currencies.gold)).toLocaleString()}</span></span>}>
    <div className="inventory-toolbar"><div className="inventory-search"><Search size={16} aria-hidden="true" /><SearchInput value={search} onChange={setSearch} placeholder="Search inventory..." /></div><label className="inventory-sort">Sort<select aria-label="Sort inventory" value={sort} onChange={(event) => setSort(event.target.value as InventorySort)}>{INVENTORY_SORTS.map((value) => <option key={value}>{value}</option>)}</select></label><div className="inventory-utility-filters"><button type="button" className={`inventory-protected-toggle ${filter === 'Protected' ? 'active' : ''}`} aria-pressed={filter === 'Protected'} onClick={() => setCategory(filter === 'Protected' ? 'All' : 'Protected')}><LockKeyhole size={14} /> Protected {filter === 'Protected' && <Check size={13} />}</button><button type="button" className={`inventory-protected-toggle ${filter === 'Needed' ? 'active' : ''}`} aria-pressed={filter === 'Needed'} onClick={() => setCategory(filter === 'Needed' ? 'All' : 'Needed')}>Needed {filter === 'Needed' && <Check size={13} />}</button></div></div>
    <div className="inventory-category-bar" role="tablist" aria-label="Inventory categories">{INVENTORY_CATEGORIES.map((value) => <button type="button" role="tab" aria-selected={filter === value} className={filter === value ? 'active' : ''} key={value} onClick={() => setCategory(value)}>{value.toUpperCase()}</button>)}</div>
    {filter === 'Materials' && <div className="inventory-material-bar" role="tablist" aria-label="Material subcategories">{MATERIAL_SUBCATEGORIES.map((value) => <button type="button" role="tab" aria-selected={materialSubcategory === value} className={materialSubcategory === value ? 'active' : ''} key={value} disabled={value !== 'All Materials' && materialSubcategoryCount(ownedIds, value) === 0} onClick={() => setMaterialSubcategory(value)}>{value}</button>)}</div>}
    <InventoryRecent entries={recentAcquisitions} inventory={inventory} protectedItems={protectedItems} equipment={equipment} flows={flowById} onSelect={selectRecent} />
    <div className="inventory-vault-content">{renderGrid()}</div>
  </Card>
  const detailPanel = <Card title="ITEM DETAILS" className="inventory-detail-card">{selected ? <InventoryDetail itemId={selected} inventory={inventory} protectedItems={protectedItems} equipment={equipment} economyState={economyState} navigate={navigate} /> : <div className="inventory-detail-empty"><div className="inventory-empty-mark">◇</div><strong>SELECT AN ITEM</strong><span>Choose an item from the Vault to inspect its source, uses, and protection.</span></div>}</Card>
  const actionsPanel = <Card title="ITEM ACTIONS" className="inventory-actions-card" action={<span className="inventory-gold"><Coins size={13} /> {Math.max(0, Math.floor(currencies.gold)).toLocaleString()}</span>}><InventoryActions itemId={selected} inventory={inventory} protectedItems={protectedItems} equipment={equipment} currencies={currencies} toggleProtection={toggleProtection} equipItem={equipItem} sellItem={sellItem} destroyItem={destroyItem} /></Card>
  return <div className="screen-content inventory-screen"><div className="screen-header"><div><div className="eyebrow">TOWER VAULT · INVENTORY</div><h1>Everything the tower currently holds.</h1><p>Inspect owned materials and equipment, trace their sources, and see exactly where they are used.</p></div></div><EditableGrid screen="inventory" panels={[{ id: 'inventory-catalog', content: catalog }, { id: 'inventory-detail', content: detailPanel }, { id: 'inventory-actions', content: actionsPanel }]} /></div>
}
