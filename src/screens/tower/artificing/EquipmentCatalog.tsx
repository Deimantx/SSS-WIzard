import { EQUIPMENT_ITEM_SLOT_LABELS, EQUIPMENT_ITEM_SLOTS } from '../../../game/core/equipment/equipmentRules'
import { useRef, type CSSProperties } from 'react'
import { Hammer, LockKeyhole, Pin, Search, ShoppingBag, Swords } from 'lucide-react'
import { Card, SearchInput, Status, GameTooltip } from '../../../components/ui'
import { ItemIcon, ItemTooltip } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import { isRecipeUnlocked, getRecipeUnlockRequirement } from '../../../game/content/recipes/recipeUnlocks'
import { getVisibleArtificingRecipes, getArtificingFilterCounts, getArtificingProfile, canCraftArtificingRecipe } from '../../../game/systems/artificing/artificingSelectors'
import type { ArtificingRecipeId, EquipmentItemSlot } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import type { ArtificingScreenPreferences } from '../../../ui/preferences/uiPreferencesTypes'
import { useProfileAttention } from '../../../ui/attention/attentionStore'
import { getActiveProfileId } from '../../../profiles/profileSessionStore'
import { useSmartScrollState } from '../../../ui/game-feel/useSmartScrollState'
import { useGameContextMenu } from '../../../ui/context-menu/GameContextMenuProvider'
import { setNavigationIntent } from '../../../ui/navigation/navigationIntent'

interface Props { selected: ArtificingRecipeId | null; onSelect: (id: ArtificingRecipeId) => void; query: string; onQueryChange: (query: string) => void }
const slots: readonly ('all' | EquipmentItemSlot)[] = ['all', ...EQUIPMENT_ITEM_SLOTS]

export function EquipmentCatalog({ selected, onSelect, query, onQueryChange }: Props) {
  const state = useGameStore()
  const filters = useUiPreferences().screenState.artificing
  const update = (changes: Partial<ArtificingScreenPreferences>) => setUiPreferences({ screenState: { artificing: changes } })
  const visible = getVisibleArtificingRecipes(state, filters, query)
  const counts = getArtificingFilterCounts(state, filters, query)
  const attention = useProfileAttention(getActiveProfileId())
  const { openContextMenu } = useGameContextMenu()
  const scroll = useRef<HTMLDivElement>(null)
  useSmartScrollState(scroll, { dependencies: [visible.map(recipe => recipe.id).join('|'), query] })
  return <Card className="artificing-catalog" title="EQUIPMENT CATALOG" action={<span className="artificing-count">{counts.visible} SHOWN</span>}>
    <div className="artificing-controls">
      <label className="artificing-search"><Search size={14} aria-hidden="true" /><SearchInput value={query} onChange={onQueryChange} placeholder="Search equipment..." /></label>
      <div className="artificing-filter-stack">
        <FilterRow label="SLOT" options={slots.map(value => ({ value, label: value === 'all' ? 'ALL' : EQUIPMENT_ITEM_SLOT_LABELS[value].toUpperCase() }))} value={filters.slotFilter} onChange={value => update({ slotFilter: value, weaponHandsFilter: 'all', offhandPresentationFilter: 'all' })} />
        {filters.slotFilter === 'weapon' && <FilterRow label="HANDS" options={(['all', 1, 2] as const).map(value => ({ value, label: value === 'all' ? 'ALL' : `${value}H` }))} value={filters.weaponHandsFilter} onChange={value => update({ weaponHandsFilter: value })} />}
        {filters.slotFilter === 'offhand' && <FilterRow label="TYPE" options={(['all', 'shield', 'focus'] as const).map(value => ({ value, label: value.toUpperCase() }))} value={filters.offhandPresentationFilter} onChange={value => update({ offhandPresentationFilter: value })} />}
        <FilterRow label="OWNERSHIP" options={(['all', 'unowned', 'owned'] as const).map(value => ({ value, label: value.toUpperCase() }))} value={filters.ownershipFilter} onChange={value => update({ ownershipFilter: value })} />
        <GameTooltip content="Show only unlocked recipes with enough legally consumable ingredients. Protected, equipped, and reserved copies cannot be spent."><button type="button" className={`artificing-craftable-toggle ${filters.craftableOnly ? 'active' : ''}`} aria-pressed={filters.craftableOnly} onClick={() => update({ craftableOnly: !filters.craftableOnly })}><span aria-hidden="true">{filters.craftableOnly ? '☑' : '☐'}</span> CRAFTABLE <small>{counts.craftable}</small></button></GameTooltip>
      </div>
      {state.debug.showLockedArtificingRecipes && <div className="artificing-locked-banner"><LockKeyhole size={14} />DEV VIEW · Locked Artificing recipes revealed</div>}
    </div>
    <div ref={scroll} className="artificing-catalog-scroll smart-scroll-region">
      {visible.length === 0 ? <div className="empty-state small">{counts.unlocked === 0 && !state.debug.showLockedArtificingRecipes ? 'Defeat a monster in Whispering Woods to discover your first Equipment blueprints.' : 'No Equipment matches these filters.'}</div> : <div className="artificing-item-grid">{visible.map(recipe => {
        const item = ITEMS[recipe.output.itemId]
        const owned = state.inventory[item.id] ?? 0
        const locked = !isRecipeUnlocked(state, recipe)
        const craftable = canCraftArtificingRecipe(state, recipe.id)
        const equipped = Object.values(state.equipment).includes(item.id)
        const status = locked ? 'LOCKED' : craftable ? 'READY' : 'MISSING'
        return <ItemTooltip key={recipe.id} itemId={item.id} owned={owned} recipeContext={{ status: locked ? 'Locked' : craftable ? 'Craftable' : 'Missing materials', outputQuantity: 1, ingredients: recipe.ingredients, unlockReason: locked ? getRecipeUnlockRequirement(recipe) ?? undefined : undefined }}>
          <button type="button" data-recipe-id={recipe.id} className={`artificing-item-card ${selected === recipe.id ? 'selected' : ''} ${locked ? 'locked' : ''}`} style={{ '--recipe-accent': item.color } as CSSProperties} aria-pressed={selected === recipe.id} onClick={() => onSelect(recipe.id)} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openContextMenu({ x: event.clientX, y: event.clientY, anchor: event.currentTarget, header: { title: recipe.name, meta: `${item.name} · ${locked ? 'LOCKED' : craftable ? 'READY' : 'MISSING MATERIALS'}` }, sections: [{ id: 'craft', actions: [{ id: 'craft-one', label: 'Craft One', icon: Hammer, disabled: locked || !craftable || Boolean(state.activities.artificing.activeRecipeId), disabledReason: locked ? getRecipeUnlockRequirement(recipe) ?? 'Recipe locked' : !craftable ? 'Missing materials' : 'Another craft is already active', onSelect: () => { onSelect(recipe.id); state.craftArtificingRecipe(recipe.id) } }] }, { id: 'recipe', actions: [{ id: 'pin', label: filters.pinnedRecipeId === recipe.id ? 'Unpin Recipe' : 'Pin Recipe', icon: Pin, onSelect: () => setUiPreferences({ screenState: { artificing: { pinnedRecipeId: filters.pinnedRecipeId === recipe.id ? null : recipe.id } } }) }, { id: 'compare', label: 'Compare Output', icon: Swords, onSelect: () => { setNavigationIntent({ equipmentItemId: item.id }); state.setScreen('equipment') } }, { id: 'inventory', label: 'Open in Inventory', icon: ShoppingBag, onSelect: () => { setNavigationIntent({ inventoryItemId: item.id }); state.setScreen('inventory') } }] }] }) }}>
            <span className="artificing-card-top">{locked && <LockKeyhole size={14} aria-label="Locked" />}{attention.unseenRecipes.includes(recipe.id) && <span className="archive-new-badge">NEW</span>}{equipped && <span className="artificing-equipped-badge" aria-label="Currently equipped">E</span>}</span>
            <ItemIcon itemId={item.id} size="tiny" /><strong>{item.name}</strong>
            <span className="artificing-badge">{getArtificingProfile(recipe)}</span>
            <Status tone={locked ? 'locked' : craftable ? 'success' : 'warning'}>{status}</Status>
          </button>
        </ItemTooltip>
      })}</div>}
    </div>
  </Card>
}

export function FilterRow<T extends string | number>({ label, options, value, onChange }: { label: string; options: Array<{ value: T; label: string }>; value: T; onChange: (value: T) => void }) {
  return <div className="artificing-filter-row"><span className="artificing-filter-label">{label}</span><div className="artificing-filter-options" role="group" aria-label={label}>{options.map(option => <GameTooltip key={option.value} content={`Filter ${label.toLowerCase()}: ${option.label.toLowerCase()}`}><button type="button" className={value === option.value ? 'active' : ''} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button></GameTooltip>)}</div></div>
}
