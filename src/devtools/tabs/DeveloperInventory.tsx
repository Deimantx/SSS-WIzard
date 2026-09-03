import { useEffect, useMemo, useState } from 'react'
import { Button, Card, FilterBar, Status, type FilterOption } from '../../components/ui'
import { ITEMS, SUPPORTING_DUNGEON_MATERIAL_IDS } from '../../game/content/items/items'
import { getInventorySearchText } from '../../game/content/items/inventoryMetadata'
import { EQUIPMENT_BOSS_RELIC_IDS, EQUIPMENT_BY_DUNGEON, isEquipmentBossRelic } from '../../game/content/equipment/equipmentSets'
import { DUNGEONS, DUNGEON_ORDER } from '../../game/content/dungeons/dungeons'
import { getItemDropSources, getItemRecipeUses, getItemSourceInfo, getMonsterDungeon } from '../../game/content/contentRelations'
import { formatEquipmentEffectSummary, formatPercent, formatStatLabel, formatStatValue } from '../../game/content/presentation/balanceFormatters'
import { RECIPES, getRecipeUnlockRequirement, isRecipeUnlocked } from '../../game/content/recipes/recipes'
import { EQUIPMENT_ITEM_SLOT_LABELS, EQUIPMENT_ITEM_SLOTS, EQUIPMENT_POSITIONS, EQUIPMENT_POSITION_LABELS } from '../../game/core/equipment'
import type { DungeonId, EquipmentItemSlot, EquipmentPosition, ItemId, MonsterId, RecipeId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { DeveloperBrowser, DeveloperBrowserLayout, DeveloperSection } from '../components/DeveloperBrowser'
import { NumberField } from './DeveloperTabPrimitives'

interface DevEquipmentLoadout {
  id: string
  label: string
  slots: Partial<Record<EquipmentPosition, ItemId>>
}

/** Explicit fixtures: the slot map is the source of truth, including Ring 1/Ring 2. */
const DEV_LOADOUTS: readonly DevEquipmentLoadout[] = [
  { id: 'woods-fire-2h', label: 'WW Fire 2H', slots: { weapon: 'ember-staff', helmet: 'wispveil-hood', amulet: 'windthread-charm', ring1: 'wispbound-ring' } },
  { id: 'woods-water-barrier', label: 'WW Water Barrier', slots: { weapon: 'wispwood-wand', offhand: 'tide-focus', armor: 'stoneweave-robe', amulet: 'heartseed-necklace' } },
  { id: 'howling-basic', label: 'Howling Basic Attack', slots: { weapon: 'fangbound-dagger', helmet: 'razorclaw-circlet', ring1: 'howling-signet' } },
  { id: 'howling-tank', label: 'Howling Tank', slots: { weapon: 'fangbound-dagger', offhand: 'fangbound-buckler', armor: 'greatbear-vestment', cape: 'predator-hide-mantle', amulet: 'greatbear-heartstone' } },
  { id: 'catacombs-status', label: 'Catacombs Status Caster', slots: { weapon: 'edrins-remnant-staff', helmet: 'wraithveil-hood', amulet: 'soulglass-amulet', ring1: 'gravebinder-ring' } },
  { id: 'catacombs-battle-mage', label: 'Catacombs Battle Mage', slots: { weapon: 'graveglass-wand', offhand: 'soulward-shield', armor: 'acolyte-vestments', ring1: 'edrins-signet' } },
]

type InventoryCategoryFilter = 'all' | 'materials' | 'equipment'
type InventorySourceFilter = 'all' | 'transmutation' | DungeonId | 'boss-relics' | 'monster-drops' | 'boss-drops'
type InventorySlotFilter = 'all' | EquipmentItemSlot
type WeaponHandsFilter = 'all' | '1H' | '2H'

const CATEGORY_FILTERS: readonly FilterOption<InventoryCategoryFilter>[] = [
  { value: 'all', label: 'ALL' },
  { value: 'materials', label: 'MATERIALS' },
  { value: 'equipment', label: 'EQUIPMENT' },
]
const SOURCE_FILTERS: readonly FilterOption<InventorySourceFilter>[] = [{ value: 'all', label: 'ALL SOURCES' }, { value: 'transmutation', label: 'TRANSMUTATION' }, { value: 'monster-drops', label: 'MONSTER DROPS' }, { value: 'boss-drops', label: 'BOSS DROPS' }, ...DUNGEON_ORDER.map((id) => ({ value: id, label: DUNGEONS[id].name.toUpperCase() })), { value: 'boss-relics', label: 'BOSS RELICS' }]
const SLOT_FILTERS: readonly FilterOption<InventorySlotFilter>[] = [{ value: 'all', label: 'ALL SLOTS' }, ...EQUIPMENT_ITEM_SLOTS.map((id) => ({ value: id, label: EQUIPMENT_ITEM_SLOT_LABELS[id] }))]
const HAND_FILTERS: readonly FilterOption<WeaponHandsFilter>[] = [
  { value: 'all', label: 'ALL WEAPONS' },
  { value: '1H', label: '1H' },
  { value: '2H', label: '2H' },
]

const ITEM_IDS = Object.keys(ITEMS) as ItemId[]
const EQUIPMENT_IDS = ITEM_IDS.filter((id) => ITEMS[id].kind === 'equipment')
const MATERIAL_IDS = ITEM_IDS.filter((id) => ITEMS[id].kind === 'material')

const sourceMatchesDungeon = (itemId: ItemId, dungeonId: DungeonId) => getItemSourceInfo(itemId).relations.some((relation) => (relation.kind === 'dungeon' && relation.id === dungeonId) || (relation.kind === 'monster' && getMonsterDungeon(relation.id as MonsterId)?.dungeonId === dungeonId))
const matchesSource = (itemId: ItemId, filter: InventorySourceFilter) => {
  if (filter === 'all') return true
  if (filter === 'transmutation') return getItemSourceInfo(itemId).relations.some((relation) => relation.kind === 'recipe')
  if (filter === 'boss-relics') return isEquipmentBossRelic(itemId)
  if (filter === 'monster-drops') return getItemDropSources(itemId).some((drop) => drop.role === 'normal')
  if (filter === 'boss-drops') return getItemDropSources(itemId).some((drop) => drop.role === 'boss')
  return sourceMatchesDungeon(itemId, filter)
}
const matchesCategory = (itemId: ItemId, filter: InventoryCategoryFilter) => filter === 'all' || (filter === 'materials' ? ITEMS[itemId].kind === 'material' : ITEMS[itemId].kind === 'equipment')
const matchesSlot = (itemId: ItemId, filter: InventorySlotFilter) => filter === 'all' || ITEMS[itemId].equipmentSlot === filter
const countLoadoutItems = (slots: DevEquipmentLoadout['slots']) => Object.values(slots).reduce<Partial<Record<ItemId, number>>>((counts, itemId) => {
  if (itemId) counts[itemId] = (counts[itemId] ?? 0) + 1
  return counts
}, {})

export function DeveloperInventory({ initialView = 'all' }: { initialView?: InventoryCategoryFilter } = {}) {
  const state = useGameStore()
  const addItem = useGameStore((game) => game.addItem)
  const removeItem = useGameStore((game) => game.removeItem)
  const equipItem = useGameStore((game) => game.equipItem)
  const unequipItem = useGameStore((game) => game.unequipItem)
  const toggleProtection = useGameStore((game) => game.toggleItemProtection)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategoryFilter>(initialView)
  const [sourceFilter, setSourceFilter] = useState<InventorySourceFilter>('all')
  const [slotFilter, setSlotFilter] = useState<InventorySlotFilter>('all')
  const [handsFilter, setHandsFilter] = useState<WeaponHandsFilter>('all')
  const [selected, setSelected] = useState<ItemId | null>('fire-fragment')
  const [quantity, setQuantity] = useState(1)
  const itemOptions = useMemo(() => ITEM_IDS.filter((id) => {
    const item = ITEMS[id]
    return matchesCategory(id, categoryFilter) && matchesSource(id, sourceFilter) && matchesSlot(id, slotFilter) && (handsFilter === 'all' || (item.equipmentSlot === 'weapon' && `${item.weaponHands}H` === handsFilter)) && getInventorySearchText(id).includes(query.trim().toLowerCase())
  }), [categoryFilter, handsFilter, query, slotFilter, sourceFilter])
  const selectedItem = selected ? ITEMS[selected] : null
  const equippedPositions = selected ? EQUIPMENT_POSITIONS.filter((position) => state.equipment[position] === selected) : []

  useEffect(() => {
    if (itemOptions.length === 0) {
      if (selected !== null) setSelected(null)
    } else if (selected === null || !itemOptions.includes(selected)) {
      setSelected(itemOptions[0])
    }
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
    EQUIPMENT_IDS.forEach((id) => { const current = useGameStore.getState(); const amount = current.inventory[id] ?? 0; if (amount > 0 && !current.protectedItems[id]) removeItem(id, amount) })
  }
  const addSelected = (amount = quantity) => { if (selected) addItem(selected, amount) }
  const removeSelected = (amount = quantity) => { if (selected) removeItem(selected, amount) }
  const addAndEquipSelected = () => { if (selected && selectedItem) { addItem(selected, quantity); if (selectedItem.kind === 'equipment') equipItem(selected) } }
  const setExactSelected = () => {
    if (!selected) return
    const current = state.inventory[selected] ?? 0
    if (quantity > current) addItem(selected, quantity - current)
    else if (quantity < current) removeItem(selected, current - quantity)
  }
  const sourceInfo = selected ? getItemSourceInfo(selected) : null
  const recipeUses = selected ? getItemRecipeUses(selected) : []
  const selectedRecipe = selectedItem?.kind === 'equipment' ? RECIPES[selected as RecipeId] : null
  const dropSources = selected ? getItemDropSources(selected) : []

  return <div className="developer-tab-stack">
    <Card title="Inventory browser" className="developer-browser-card">
      <div className="developer-filter-stack">
        <div className="developer-filter-label">CATEGORY<FilterBar options={CATEGORY_FILTERS} value={categoryFilter} onChange={setCategoryFilter} ariaLabel="Developer inventory category" /></div>
        <label>Search items<input aria-label="Search items" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Fragments, equipment..." /></label>
        <div className="developer-filter-label">SOURCE / ORIGIN<FilterBar options={SOURCE_FILTERS} value={sourceFilter} onChange={setSourceFilter} ariaLabel="Developer inventory source" /></div>
        <div className="developer-filter-label">EQUIPMENT SLOT<FilterBar options={SLOT_FILTERS} value={slotFilter} onChange={setSlotFilter} ariaLabel="Developer equipment slot" /></div>
        {(slotFilter === 'all' || slotFilter === 'weapon') && <div className="developer-filter-label">WEAPON HANDS<FilterBar options={HAND_FILTERS} value={handsFilter} onChange={setHandsFilter} ariaLabel="Developer weapon hands" /></div>}
      </div>
      <DeveloperBrowserLayout
        browser={<><div className="developer-browser-heading"><strong>{itemOptions.length} authored items</strong><small>Click an item to inspect its runtime definition.</small></div><DeveloperBrowser items={itemOptions.map((id) => ({ id, label: ITEMS[id].name, icon: ITEMS[id].icon, accent: ITEMS[id].color, meta: `${id} · ${ITEMS[id].kind}${ITEMS[id].equipmentSlot ? ` · ${ITEMS[id].equipmentSlot}` : ''}`, status: <>{state.inventory[id] ?? 0}{Object.values(state.equipment).includes(id) && <span className="developer-mini-status">EQUIPPED</span>}{state.protectedItems[id] && <span className="developer-mini-status">PROTECTED</span>}</> }))} selectedId={selected} onSelect={(id) => setSelected(id as ItemId)} emptyMessage="No matching items. Change the filters or search." /></>}
        inspector={selectedItem && selected ? <>
          <div className="developer-inspector-title"><span className="developer-browser-icon" style={{ color: selectedItem.color }}>{selectedItem.icon}</span><div><h2>{selectedItem.name}</h2><code>{selected}</code></div><Status tone={equippedPositions.length > 0 ? 'warning' : state.protectedItems[selected] ? 'warning' : 'neutral'}>{equippedPositions.length > 0 ? 'EQUIPPED' : state.protectedItems[selected] ? 'PROTECTED' : `${state.inventory[selected] ?? 0} OWNED`}</Status></div>
          <DeveloperSection title="Identity"><div className="developer-detail-grid"><span>KIND<strong>{selectedItem.kind}</strong></span><span>CATEGORY<strong>{selectedItem.category}</strong></span><span>VAULT<strong>{selectedItem.inventoryCategory}</strong></span><span>OWNED<strong>{state.inventory[selected] ?? 0}</strong></span><span>SELL VALUE<strong>{selectedItem.sellValue ?? '—'}</strong></span><span>DESTROY<strong>{selectedItem.canDestroy ? 'Allowed' : selectedItem.actionRestrictionReason ?? 'Blocked'}</strong></span></div><p className="muted">{selectedItem.description}</p></DeveloperSection>
          <DeveloperSection title="Source relationships"><p className="developer-relation-line"><strong>Authored source:</strong> {selectedItem.source}</p><div className="developer-relation-list">{sourceInfo?.relations.length ? sourceInfo.relations.map((relation) => <span key={`${relation.kind}-${relation.id}`}><strong>{relation.label}</strong><small>{relation.kind} · {relation.detail} · {relation.id}</small></span>) : <span className="muted">No derived relationship is authored for this item.</span>}</div></DeveloperSection>
          {selectedItem.kind === 'equipment' && <DeveloperSection title="Equipment definition"><div className="developer-detail-grid"><span>SLOT<strong>{selectedItem.equipmentSlot}</strong></span>{selectedItem.weaponHands && <span>HANDS<strong>{selectedItem.weaponHands}H</strong></span>}<span>POSITIONS<strong>{selectedItem.equipmentSlot === 'ring' ? 'Ring 1 / Ring 2' : selectedItem.equipmentSlot}</strong></span></div>{selectedItem.stats && <div className="developer-stat-list">{Object.entries(selectedItem.stats).flatMap(([key, value]) => key === 'resistances' ? Object.entries(value ?? {}).map(([damageType, resistance]) => <span key={`resistance-${damageType}`}><small>{formatStatLabel(`${damageType} resistance`)}</small><strong>{formatPercent(Number(resistance))}</strong></span>) : <span key={key}><small>{formatStatLabel(key)}</small><strong>{formatStatValue(key, Number(value))}</strong></span>)}</div>}<div className="developer-relation-list">{formatEquipmentEffectSummary(selectedItem).length ? formatEquipmentEffectSummary(selectedItem).map((effect) => <span key={effect}><strong>{effect.startsWith('Passive:') ? 'Passive effect' : 'Triggered effect'}</strong><small>{effect.replace(/^(Passive: |[^:]+: )/, '')}</small></span>) : <span className="muted">No additional combat effect is authored.</span>}</div></DeveloperSection>}
          {selectedItem.kind === 'material' && <DeveloperSection title="Material definition"><div className="developer-detail-grid"><span>SUBTYPE<strong>{selectedItem.materialSubtype ?? '—'}</strong></span><span>RESEARCH<strong>{selectedItem.researchSchool ?? '—'}</strong></span></div><div className="developer-relation-list">{dropSources.length ? dropSources.map((drop) => <span key={`${drop.monsterId}-${drop.min}-${drop.max}`}><strong>{drop.monsterName} · {drop.role}</strong><small>{drop.dungeonName} · {drop.min}–{drop.max} quantity · {(drop.chance * 100).toFixed(2)}% chance</small></span>) : <span className="muted">No direct monster drop entry is authored.</span>}</div></DeveloperSection>}
          {selectedRecipe && <DeveloperSection title="Recipe and unlock"><div className="developer-detail-grid"><span>RECIPE<strong>{selectedRecipe.id}</strong></span><span>UNLOCKED<strong>{isRecipeUnlocked(state, selectedRecipe) ? 'yes' : 'no'}</strong></span></div><p className="developer-relation-line">{getRecipeUnlockRequirement(selectedRecipe) ?? 'Always unlocked'}</p><div className="developer-relation-list">{selectedRecipe.ingredients.map((ingredient) => <span key={ingredient.itemId}><strong>{ITEMS[ingredient.itemId].name}</strong><small>{ingredient.itemId} · {ingredient.quantity} required</small></span>)}</div></DeveloperSection>}
          <DeveloperSection title="Recipe uses"><div className="developer-relation-list">{recipeUses.length ? recipeUses.map((recipe) => <span key={recipe.id}><strong>{recipe.name}</strong><small>{recipe.id} · {recipe.ingredients.find((ingredient) => ingredient.itemId === selected)?.quantity ?? 0} required</small></span>) : <span className="muted">No recipe consumes this item.</span>}</div></DeveloperSection>
          <DeveloperSection title="Inventory actions"><NumberField label="Quantity / exact owned" value={quantity} onChange={(value) => setQuantity(Math.max(1, Math.floor(value)))} /><div className="button-row"><Button onClick={addSelected}>Add</Button><Button onClick={() => addSelected(1)}>+1</Button><Button onClick={() => addSelected(10)}>+10</Button><Button onClick={() => addSelected(100)}>+100</Button><Button variant="ghost" onClick={setExactSelected}>Set exact</Button><Button variant="secondary" onClick={() => removeSelected(1)}>Remove 1</Button><Button variant="secondary" onClick={() => removeSelected(10)}>Remove 10</Button><Button variant="danger" onClick={() => removeSelected(state.inventory[selected] ?? 0)} disabled={(state.inventory[selected] ?? 0) < 1}>Remove all</Button><Button variant="ghost" onClick={() => toggleProtection(selected)} disabled={equippedPositions.length > 0}>{state.protectedItems[selected] ? 'Unprotect' : 'Toggle Protected'}</Button></div></DeveloperSection>
          {selectedItem.kind === 'equipment' && <DeveloperSection title="Equipment actions"><div className="button-row"><Button onClick={addSelected}>Add</Button><Button variant="secondary" onClick={addAndEquipSelected}>Add &amp; Equip</Button>{selectedItem.equipmentSlot === 'ring' ? <><Button variant="secondary" onClick={() => equipItem(selected, 'ring1')}>Equip Ring 1</Button><Button variant="secondary" onClick={() => equipItem(selected, 'ring2')}>Equip Ring 2</Button></> : <Button variant="secondary" onClick={() => equipItem(selected, selectedItem.equipmentSlot as EquipmentPosition)}>Equip</Button>}</div>{equippedPositions.length > 0 && <div className="button-row">{equippedPositions.map((position) => <Button key={position} variant="ghost" onClick={() => unequipItem(position)}>Unequip {EQUIPMENT_POSITION_LABELS[position]}</Button>)}</div>}</DeveloperSection>}
        </> : <div className="developer-browser-empty"><strong>No matching items</strong><small>Change the search or filter to select an item before using Dev Inventory actions.</small></div>}
      />
    </Card>
    <div className="developer-tab-grid">
      <Card title="Quick groups"><p className="muted">All grants use normal acquisition. Removal respects protected and equipped item rules.</p><div className="developer-button-grid"><Button variant="secondary" onClick={() => addGroup(MATERIAL_IDS.filter((id) => ITEMS[id].category === 'elemental'), 10)}>Add elemental fragments ×10</Button><Button variant="secondary" onClick={() => addGroup(SUPPORTING_DUNGEON_MATERIAL_IDS, 100)}>Add dungeon materials ×100</Button><Button variant="secondary" onClick={() => addGroup(EQUIPMENT_IDS, 1)}>Add 1 of every equipment</Button>{Object.entries(EQUIPMENT_BY_DUNGEON).map(([id, ids]) => <Button key={id} variant="secondary" onClick={() => addGroup(ids, 1)}>Add {DUNGEONS[id as DungeonId].name} equipment</Button>)}<Button variant="secondary" onClick={() => addGroup(EQUIPMENT_BOSS_RELIC_IDS, 1)}>Add boss relics</Button><Button variant="ghost" onClick={() => SUPPORTING_DUNGEON_MATERIAL_IDS.forEach((id) => { const current = useGameStore.getState(); const amount = current.inventory[id] ?? 0; if (amount > 0) removeItem(id, amount) })}>Clear dungeon materials</Button><Button variant="ghost" onClick={clearEquipmentInventory}>Clear unprotected equipment</Button></div><div className="developer-owned-list">{ITEM_IDS.filter((id) => (state.inventory[id] ?? 0) > 0).map((id) => <span key={id}>{ITEMS[id].name}<strong>{state.inventory[id]}</strong></span>)}</div></Card>
      <Card title="Equipment loadout presets" className="developer-debug-card"><p className="muted">Six explicit slot-map fixtures. Missing copies are granted through normal acquisition, then each authored slot is equipped through normal equip rules.</p><div className="developer-button-grid">{DEV_LOADOUTS.map((loadout) => <Button key={loadout.id} variant="secondary" onClick={() => loadLoadout(loadout)}>{loadout.label}</Button>)}<Button variant="ghost" onClick={unequipAll}>Unequip all</Button></div><div className="developer-loadout-list">{DEV_LOADOUTS.map((loadout) => <div key={loadout.id}><strong>{loadout.label}</strong><small>{Object.entries(loadout.slots).map(([position, itemId]) => `${EQUIPMENT_POSITION_LABELS[position as EquipmentPosition]}: ${ITEMS[itemId].name}`).join(' · ')}</small></div>)}</div></Card>
    </div>
  </div>
}
