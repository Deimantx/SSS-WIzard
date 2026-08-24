import { useState } from 'react'
import { Button, Card, Status } from '../../components/ui'
import { ITEMS } from '../../game/data/items'
import type { ItemId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField } from './DeveloperTabPrimitives'

export function DeveloperInventory() {
  const state = useGameStore()
  const addItem = useGameStore((game) => game.addItem)
  const removeItem = useGameStore((game) => game.removeItem)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ItemId>('fire-fragment')
  const [quantity, setQuantity] = useState(1)
  const itemOptions = (Object.keys(ITEMS) as ItemId[]).filter((id) => `${ITEMS[id].name} ${id}`.toLowerCase().includes(query.toLowerCase()))
  const selectedItem = ITEMS[selected]
  const addGroup = (ids: ItemId[]) => ids.forEach((id) => addItem(id, 10))
  return <div className="developer-tab-grid"><Card title="Item controls"><label>Search items<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Fragments, equipment..." /></label><label>Item<select value={selected} onChange={(event) => setSelected(event.target.value as ItemId)}>{itemOptions.map((id) => <option key={id} value={id}>{ITEMS[id].name}</option>)}</select></label><div className="developer-item-selected"><span style={{ color: selectedItem.color }}>{selectedItem.icon}</span><div><strong>{selectedItem.name}</strong><small>{selectedItem.description}</small></div><Status tone={state.protectedItems[selected] || Object.values(state.equipment).includes(selected) ? 'warning' : 'neutral'}>{Object.values(state.equipment).includes(selected) ? 'Equipped' : state.protectedItems[selected] ? 'Protected' : `${state.inventory[selected] ?? 0} owned`}</Status></div><NumberField label="Quantity" value={quantity} onChange={(value) => setQuantity(Math.max(1, value))} /><div className="button-row"><Button onClick={() => addItem(selected, quantity)}>Add</Button><Button variant="secondary" onClick={() => removeItem(selected, quantity)}>Remove</Button><Button variant="ghost" onClick={() => { const current = state.inventory[selected] ?? 0; if (quantity > current) addItem(selected, quantity - current); else if (quantity < current) removeItem(selected, current - quantity) }}>Set exact</Button></div></Card><Card title="Quick groups"><p className="muted">Remove respects equipped and protected item rules.</p><div className="developer-button-grid"><Button variant="secondary" onClick={() => addGroup((Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].category === 'elemental'))}>Add elemental fragments</Button><Button variant="secondary" onClick={() => addGroup((Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].category === 'monster-loot' || ITEMS[id].category === 'boss-loot'))}>Add monster materials</Button><Button variant="secondary" onClick={() => addGroup((Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === 'equipment'))}>Add equipment bundle</Button></div><div className="developer-owned-list">{(Object.keys(ITEMS) as ItemId[]).filter((id) => (state.inventory[id] ?? 0) > 0).map((id) => <span key={id}>{ITEMS[id].name}<strong>{state.inventory[id]}</strong></span>)}</div></Card></div>
}
