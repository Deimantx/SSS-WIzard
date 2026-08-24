import { Lock, Search, ShieldCheck, Unlock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ITEMS } from '../../game/data/items'
import { RECIPES } from '../../game/data/recipes'
import type { ItemCategory, ItemId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, SearchInput, Status, Tabs } from '../../components/ui'
import { formatNumber } from '../../game/utils'

const filters = ['All', 'Elemental', 'Monster Loot', 'Equipment', 'Boss Loot'] as const
const categoryForFilter: Record<typeof filters[number], ItemCategory | null> = { All: null, Elemental: 'elemental', 'Monster Loot': 'monster-loot', Equipment: 'equipment', 'Boss Loot': 'boss-loot' }

export function InventoryScreenV2() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<typeof filters[number]>('All')
  const [selected, setSelected] = useState<ItemId | null>(null)
  const inventory = useGameStore((state) => state.inventory)
  const protectedItems = useGameStore((state) => state.protectedItems)
  const equipment = useGameStore((state) => state.equipment)
  const toggleProtection = useGameStore((state) => state.toggleItemProtection)
  const equipItem = useGameStore((state) => state.equipItem)
  const items = useMemo(() => (Object.keys(ITEMS) as ItemId[]).filter((id) => { const item = ITEMS[id]; return (!categoryForFilter[filter] || item.category === categoryForFilter[filter]) && item.name.toLowerCase().includes(search.toLowerCase()) }), [filter, search])
  const detail = selected ? ITEMS[selected] : null
  const equipped = selected ? Object.values(equipment).includes(selected) : false
  return <div className="screen-content"><div className="screen-header"><div><div className="eyebrow">TOWER VAULT · INVENTORY</div><h1>Everything the tower has earned.</h1><p>Protect important materials, inspect their sources, and send the right item into Research or Transmutation.</p></div></div><Card title="Materials, loot, and equipment" action={<span className="muted">{items.length} visible items</span>}><div className="inventory-toolbar"><div className="inventory-search"><Search size={15} /><SearchInput value={search} onChange={setSearch} placeholder="Search items" /></div><Tabs items={filters} active={filter} onChange={setFilter} /></div><div className="inventory-v2-layout"><div className="inventory-grid">{items.map((id) => { const item = ITEMS[id]; const quantity = inventory[id] ?? 0; const locked = Boolean(protectedItems[id]) || Object.values(equipment).includes(id); return <button className={`inventory-item ${quantity ? '' : 'empty'} ${selected === id ? 'selected' : ''}`} key={id} onClick={() => setSelected(id)}><div className="item-icon" style={{ color: item.color }}>{item.icon}</div><div><strong>{item.name}</strong><small>{item.category.replace('-', ' ')}</small></div><div className="inventory-quantity"><b>×{formatNumber(quantity)}</b>{locked && <Lock size={12} />}</div></button> })}</div>{detail ? <div className="item-detail"><div className="item-detail-head"><div className="item-icon large" style={{ color: detail.color }}>{detail.icon}</div><div><Status tone={equipped ? 'success' : protectedItems[selected!] ? 'warning' : 'neutral'}>{equipped ? 'Equipped' : protectedItems[selected!] ? 'Locked' : detail.kind === 'equipment' ? 'Unprotected' : 'Available'}</Status><h2>{detail.name}</h2></div></div><p>{detail.description}</p><div className="detail-list"><span>Quantity <strong>{formatNumber(inventory[selected!] ?? 0)}</strong></span><span>Category <strong>{detail.category.replace('-', ' ')}</strong></span><span>Source <strong>{detail.source}</strong></span>{detail.researchXp && <span>Base Research XP <strong>{detail.researchXp}</strong></span>}{detail.stats && <span>Equipment stats <strong>{Object.entries(detail.stats).map(([key, value]) => `${key}: ${value}`).join(' · ') || 'Starter focus'}</strong></span>}</div><div className="detail-actions">{detail.kind === 'equipment' && <Button onClick={() => equipItem(selected!)} disabled={!inventory[selected!]}>{equipped ? 'Equipped' : 'Equip item'}</Button>}{!equipped && <Button variant={protectedItems[selected!] ? 'success' : 'secondary'} onClick={() => toggleProtection(selected!)}>{protectedItems[selected!] ? <><Unlock size={14} /> Unlock item</> : <><ShieldCheck size={14} /> Lock item</>}</Button>}</div><div className="detail-uses"><strong>Used in</strong>{Object.values(RECIPES).filter((recipe) => recipe.ingredients.some((ingredient) => ingredient.itemId === selected)).map((recipe) => <span key={recipe.id}>{recipe.name}</span>)}{detail.researchSchool && <span>Research → any Magic School</span>}</div></div> : <div className="empty-state">Select an item to inspect protection, source, and uses.</div>}</div></Card></div>
}
