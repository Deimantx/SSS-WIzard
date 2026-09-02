import { useState } from 'react'
import { Button, Card, Status } from '../../components/ui'
import { ITEMS, SUPPORTING_DUNGEON_MATERIAL_IDS } from '../../game/content/items/items'
import { RECIPES } from '../../game/content/recipes/recipes'
import { EQUIPMENT_POSITIONS } from '../../game/core/equipment'
import type { ItemId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField } from './DeveloperTabPrimitives'

const DEV_LOADOUTS: Array<{ id: string; label: string; items: ItemId[] }> = [
  { id: 'woods-fire-2h', label: 'WW Fire 2H', items: ['ember-staff', 'wispveil-hood', 'windthread-charm', 'wispbound-ring'] },
  { id: 'woods-water-barrier', label: 'WW Water Barrier', items: ['wispwood-wand', 'tide-focus', 'stoneweave-robe', 'heartseed-necklace'] },
  { id: 'howling-basic', label: 'Howling Basic Attack', items: ['fangbound-dagger', 'razorclaw-circlet', 'howling-signet'] },
  { id: 'howling-tank', label: 'Howling Tank', items: ['fangbound-dagger', 'fangbound-buckler', 'greatbear-vestment', 'predator-hide-mantle', 'greatbear-heartstone'] },
  { id: 'catacombs-status', label: 'Catacombs Status Caster', items: ['edrins-remnant-staff', 'wraithveil-hood', 'soulglass-amulet', 'gravebinder-ring'] },
  { id: 'catacombs-battle-mage', label: 'Catacombs Battle Mage', items: ['graveglass-wand', 'soulward-shield', 'acolyte-vestments', 'edrins-signet'] },
]

export function DeveloperInventory() {
  const state = useGameStore()
  const addItem = useGameStore((game) => game.addItem)
  const removeItem = useGameStore((game) => game.removeItem)
  const equipItem = useGameStore((game) => game.equipItem)
  const unequipItem = useGameStore((game) => game.unequipItem)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ItemId>('fire-fragment')
  const [quantity, setQuantity] = useState(1)
  const itemOptions = (Object.keys(ITEMS) as ItemId[]).filter((id) => `${ITEMS[id].name} ${id}`.toLowerCase().includes(query.toLowerCase()))
  const selectedItem = ITEMS[selected]
  const equipmentIds = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === 'equipment')
  const recipeEquipmentIds = new Set(Object.values(RECIPES).filter((recipe) => recipe.category === 'equipment').map((recipe) => recipe.output.itemId))
  const directRelicIds = equipmentIds.filter((id) => !recipeEquipmentIds.has(id))
  const equipmentFor = (group: 'woods' | 'howling' | 'catacombs') => equipmentIds.filter((id) => {
    const recipe = RECIPES[id as keyof typeof RECIPES]
    if (recipe?.category === 'equipment') {
      if (group === 'woods') return recipe.unlock.type === 'boss-kill' && recipe.unlock.bossId === 'grove-sentinel'
      return recipe.unlock.type === 'dungeon-unlocked' && recipe.unlock.dungeonId === (group === 'howling' ? 'howling-den' : 'abandoned-catacombs')
    }
    const source = ITEMS[id].source.toLowerCase()
    return group === 'woods' ? source.includes('forest heart') : group === 'howling' ? source.includes('greatbear') : source.includes('edrin')
  })
  const addGroup = (ids: ItemId[], amount: number) => ids.forEach((id) => addItem(id, amount))
  const unequipAll = () => EQUIPMENT_POSITIONS.forEach((position) => unequipItem(position))
  const loadLoadout = (items: ItemId[]) => {
    unequipAll()
    items.forEach((id) => addItem(id, id.endsWith('ring') || id === 'wispbound-ring' ? 2 : 1))
    items.forEach((id) => equipItem(id))
  }
  const clearEquipmentInventory = () => {
    unequipAll()
    equipmentIds.forEach((id) => removeItem(id, state.inventory[id] ?? 0))
  }
  return <div className="developer-tab-grid"><Card title="Item controls"><label>Search items<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Fragments, equipment..." /></label><label>Item<select value={selected} onChange={(event) => setSelected(event.target.value as ItemId)}>{itemOptions.map((id) => <option key={id} value={id}>{ITEMS[id].name}</option>)}</select></label><div className="developer-item-selected"><span style={{ color: selectedItem.color }}>{selectedItem.icon}</span><div><strong>{selectedItem.name}</strong><small>{selectedItem.description}</small></div><Status tone={state.protectedItems[selected] || Object.values(state.equipment).includes(selected) ? 'warning' : 'neutral'}>{Object.values(state.equipment).includes(selected) ? 'Equipped' : state.protectedItems[selected] ? 'Protected' : `${state.inventory[selected] ?? 0} owned`}</Status></div><NumberField label="Quantity" value={quantity} onChange={(value) => setQuantity(Math.max(1, value))} /><div className="button-row"><Button onClick={() => addItem(selected, quantity)}>Add</Button><Button variant="secondary" onClick={() => removeItem(selected, quantity)}>Remove</Button><Button variant="secondary" onClick={() => { addItem(selected, quantity); if (selectedItem.kind === 'equipment') equipItem(selected) }}>Add and equip</Button><Button variant="ghost" onClick={() => { const current = state.inventory[selected] ?? 0; if (quantity > current) addItem(selected, quantity - current); else if (quantity < current) removeItem(selected, current - quantity) }}>Set exact</Button></div></Card><Card title="Quick groups"><p className="muted">Remove respects equipped and protected item rules.</p><div className="developer-button-grid"><Button variant="secondary" onClick={() => addGroup((Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].category === 'elemental'), 10)}>Add elemental fragments ×10</Button><Button variant="secondary" onClick={() => addGroup((Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === 'material' && ITEMS[id].sourceNavigation === 'combat'), 100)}>Add dungeon materials ×100</Button><Button variant="secondary" onClick={() => addGroup(equipmentIds, 1)}>Add 1 of every equipment</Button><Button variant="secondary" onClick={() => addGroup(equipmentFor('woods'), 1)}>Add Whispering Woods equipment</Button><Button variant="secondary" onClick={() => addGroup(equipmentFor('howling'), 1)}>Add Howling Den equipment</Button><Button variant="secondary" onClick={() => addGroup(equipmentFor('catacombs'), 1)}>Add Catacombs equipment</Button><Button variant="secondary" onClick={() => addGroup(directRelicIds, 1)}>Add boss relics</Button><Button variant="ghost" onClick={() => SUPPORTING_DUNGEON_MATERIAL_IDS.forEach((id) => removeItem(id, state.inventory[id] ?? 0))}>Clear new dungeon materials</Button><Button variant="ghost" onClick={clearEquipmentInventory}>Clear unprotected equipment</Button></div><div className="developer-owned-list">{(Object.keys(ITEMS) as ItemId[]).filter((id) => (state.inventory[id] ?? 0) > 0).map((id) => <span key={id}>{ITEMS[id].name}<strong>{state.inventory[id]}</strong></span>)}</div></Card><Card title="Equipment loadout presets" className="developer-debug-card"><p className="muted">DEV-only fixtures use normal acquisition and equip actions. Duplicate ring copies are granted where needed.</p><div className="developer-button-grid">{DEV_LOADOUTS.map((loadout) => <Button key={loadout.id} variant="secondary" onClick={() => loadLoadout(loadout.items)}>{loadout.label}</Button>)}<Button variant="ghost" onClick={unequipAll}>Unequip all</Button></div></Card></div>
}
