import { useEffect, useMemo, useState } from 'react'
import { Button, Card, FilterBar, Status, type FilterOption } from '../../components/ui'
import { ITEMS, SUPPORTING_DUNGEON_MATERIAL_IDS } from '../../game/content/items/items'
import { EQUIPMENT_BOSS_RELIC_IDS, EQUIPMENT_BY_DUNGEON, getEquipmentIdsForDungeon } from '../../game/content/equipment/equipmentSets'
import { EQUIPMENT_POSITIONS } from '../../game/core/equipment'
import type { DungeonId, EquipmentPosition, ItemId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField } from './DeveloperTabPrimitives'

interface DevEquipmentLoadout {
  id: string
  label: string
  slots: Partial<Record<EquipmentPosition, ItemId>>
}

const DEV_LOADOUTS: readonly DevEquipmentLoadout[] = [
  { id: 'woods-fire-2h', label: 'WW Fire 2H', slots: { weapon: 'ember-staff', helmet: 'wispveil-hood', amulet: 'windthread-charm', ring1: 'wispbound-ring' } },
  { id: 'woods-water-barrier', label: 'WW Water Barrier', slots: { weapon: 'wispwood-wand', offhand: 'tide-focus', armor: 'stoneweave-robe', amulet: 'heartseed-necklace' } },
  { id: 'howling-basic', label: 'Howling Basic Attack', slots: { weapon: 'fangbound-dagger', helmet: 'razorclaw-circlet', ring1: 'howling-signet' } },
  { id: 'howling-tank', label: 'Howling Tank', slots: { weapon: 'fangbound-dagger', offhand: 'fangbound-buckler', armor: 'greatbear-vestment', cape: 'predator-hide-mantle', amulet: 'greatbear-heartstone' } },
  { id: 'catacombs-status', label: 'Catacombs Status Caster', slots: { weapon: 'edrins-remnant-staff', helmet: 'wraithveil-hood', amulet: 'soulglass-amulet', ring1: 'gravebinder-ring' } },
  { id: 'catacombs-battle-mage', label: 'Catacombs Battle Mage', slots: { weapon: 'graveglass-wand', offhand: 'soulward-shield', armor: 'acolyte-vestments', ring1: 'edrins-signet' } },
]

type InventoryFilter = 'all' | 'materials' | 'equipment' | DungeonId | 'boss-relics'
const INVENTORY_FILTERS: readonly FilterOption<InventoryFilter>[] = [
  { value: 'all', label: 'ALL' },
  { value: 'materials', label: 'MATERIALS' },
  { value: 'equipment', label: 'EQUIPMENT' },
  { value: 'whispering-woods', label: 'WHISPERING WOODS' },
  { value: 'howling-den', label: 'HOWLING DEN' },
  { value: 'abandoned-catacombs', label: 'ABANDONED CATACOMBS' },
  { value: 'boss-relics', label: 'BOSS RELICS' },
]

const EQUIPMENT_IDS = Object.keys(ITEMS).filter((id) => ITEMS[id as ItemId].kind === 'equipment') as ItemId[]
const MATERIAL_IDS = Object.keys(ITEMS).filter((id) => ITEMS[id as ItemId].kind === 'material') as ItemId[]

const matchesFilter = (itemId: ItemId, filter: InventoryFilter) => {
  const item = ITEMS[itemId]
  if (filter === 'all') return true
  if (filter === 'materials') return item.kind === 'material'
  if (filter === 'equipment') return item.kind === 'equipment'
  if (filter === 'boss-relics') return EQUIPMENT_BOSS_RELIC_IDS.includes(itemId)
  return getEquipmentIdsForDungeon(filter).includes(itemId)
}

const countLoadoutItems = (slots: DevEquipmentLoadout['slots']) => Object.values(slots).reduce<Partial<Record<ItemId, number>>>((counts, itemId) => {
  if (itemId) counts[itemId] = (counts[itemId] ?? 0) + 1
  return counts
}, {})

export function DeveloperInventory() {
  const state = useGameStore()
  const addItem = useGameStore((game) => game.addItem)
  const removeItem = useGameStore((game) => game.removeItem)
  const equipItem = useGameStore((game) => game.equipItem)
  const unequipItem = useGameStore((game) => game.unequipItem)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<InventoryFilter>('all')
  const [selected, setSelected] = useState<ItemId>('fire-fragment')
  const [quantity, setQuantity] = useState(1)
  const itemOptions = useMemo(() => (Object.keys(ITEMS) as ItemId[]).filter((id) => matchesFilter(id, filter) && `${ITEMS[id].name} ${id}`.toLowerCase().includes(query.toLowerCase())), [filter, query])
  const selectedItem = ITEMS[selected] ?? ITEMS['fire-fragment']

  useEffect(() => {
    if (!itemOptions.includes(selected)) setSelected(itemOptions[0] ?? 'fire-fragment')
  }, [itemOptions, selected])

  const addGroup = (ids: readonly ItemId[], amount: number) => ids.forEach((id) => addItem(id, amount))
  const unequipAll = () => EQUIPMENT_POSITIONS.forEach((position) => unequipItem(position))
  const loadLoadout = (loadout: DevEquipmentLoadout) => {
    unequipAll()
    const requiredCopies = countLoadoutItems(loadout.slots)
    Object.entries(requiredCopies).forEach(([id, required]) => {
      const itemId = id as ItemId
      const missing = Math.max(0, (required ?? 0) - (useGameStore.getState().inventory[itemId] ?? 0))
      if (missing > 0) addItem(itemId, missing)
    })
    Object.entries(loadout.slots).forEach(([position, itemId]) => { if (itemId) equipItem(itemId, position as EquipmentPosition) })
  }
  const clearEquipmentInventory = () => {
    unequipAll()
    EQUIPMENT_IDS.forEach((id) => { const amount = useGameStore.getState().inventory[id] ?? 0; if (amount > 0) removeItem(id, amount) })
  }

  return <div className="developer-tab-grid">
    <Card title="Item controls">
      <div className="developer-filter-bar"><FilterBar options={INVENTORY_FILTERS} value={filter} onChange={setFilter} ariaLabel="Developer inventory filter" /></div>
      <label>Search items<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Fragments, equipment..." /></label>
      <label>Item<select value={selected} onChange={(event) => setSelected(event.target.value as ItemId)}>{itemOptions.map((id) => <option key={id} value={id}>{ITEMS[id].name}</option>)}</select></label>
      <div className="developer-item-selected"><span style={{ color: selectedItem.color }}>{selectedItem.icon}</span><div><strong>{selectedItem.name}</strong><small>{selectedItem.description}</small></div><Status tone={state.protectedItems[selected] || Object.values(state.equipment).includes(selected) ? 'warning' : 'neutral'}>{Object.values(state.equipment).includes(selected) ? 'Equipped' : state.protectedItems[selected] ? 'Protected' : `${state.inventory[selected] ?? 0} owned`}</Status></div>
      <NumberField label="Quantity" value={quantity} onChange={(value) => setQuantity(Math.max(1, value))} />
      <div className="button-row"><Button onClick={() => addItem(selected, quantity)}>Add</Button><Button variant="secondary" onClick={() => removeItem(selected, quantity)}>Remove</Button><Button variant="secondary" onClick={() => { addItem(selected, quantity); if (selectedItem.kind === 'equipment') equipItem(selected) }}>Add and equip</Button><Button variant="ghost" onClick={() => { const current = state.inventory[selected] ?? 0; if (quantity > current) addItem(selected, quantity - current); else if (quantity < current) removeItem(selected, current - quantity) }}>Set exact</Button></div>
    </Card>
    <Card title="Quick groups">
      <p className="muted">Remove respects equipped and protected item rules.</p>
      <div className="developer-button-grid"><Button variant="secondary" onClick={() => addGroup(MATERIAL_IDS.filter((id) => ITEMS[id].category === 'elemental'), 10)}>Add elemental fragments ×10</Button><Button variant="secondary" onClick={() => addGroup(SUPPORTING_DUNGEON_MATERIAL_IDS, 100)}>Add new dungeon materials ×100</Button><Button variant="secondary" onClick={() => addGroup(EQUIPMENT_IDS, 1)}>Add 1 of every equipment</Button><Button variant="secondary" onClick={() => addGroup(EQUIPMENT_BY_DUNGEON['whispering-woods'], 1)}>Add Whispering Woods equipment</Button><Button variant="secondary" onClick={() => addGroup(EQUIPMENT_BY_DUNGEON['howling-den'], 1)}>Add Howling Den equipment</Button><Button variant="secondary" onClick={() => addGroup(EQUIPMENT_BY_DUNGEON['abandoned-catacombs'], 1)}>Add Catacombs equipment</Button><Button variant="secondary" onClick={() => addGroup(EQUIPMENT_BOSS_RELIC_IDS, 1)}>Add boss relics</Button><Button variant="ghost" onClick={() => SUPPORTING_DUNGEON_MATERIAL_IDS.forEach((id) => { const amount = useGameStore.getState().inventory[id] ?? 0; if (amount > 0) removeItem(id, amount) })}>Clear new dungeon materials</Button><Button variant="ghost" onClick={clearEquipmentInventory}>Clear unprotected equipment</Button></div>
      <div className="developer-owned-list">{(Object.keys(ITEMS) as ItemId[]).filter((id) => (state.inventory[id] ?? 0) > 0).map((id) => <span key={id}>{ITEMS[id].name}<strong>{state.inventory[id]}</strong></span>)}</div>
    </Card>
    <Card title="Equipment loadout presets" className="developer-debug-card"><p className="muted">DEV-only fixtures use normal acquisition and equip actions. Presets explicitly map Equipment positions and derive duplicate copies automatically.</p><div className="developer-button-grid">{DEV_LOADOUTS.map((loadout) => <Button key={loadout.id} variant="secondary" onClick={() => loadLoadout(loadout)}>{loadout.label}</Button>)}<Button variant="ghost" onClick={unequipAll}>Unequip all</Button></div></Card>
  </div>
}
