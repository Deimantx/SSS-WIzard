import { EQUIPMENT_ITEM_SLOT_LABELS, EQUIPMENT_ITEM_SLOTS } from '../../../game/core/equipment/equipmentRules'
import { useRef, type CSSProperties } from 'react'
import { Check, Hammer, LockKeyhole, Pin, Search, ShoppingBag, Swords } from 'lucide-react'
import { Card, SearchInput, Status, GameTooltip } from '../../../components/ui'
import { ItemIcon, ItemTooltip } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import { isRecipeUnlocked, getRecipeUnlockRequirement } from '../../../game/content/recipes/recipeUnlocks'
import { getVisibleArtificingRecipes, getArtificingFilterCounts, getArtificingProfile, getArtificingCatalogRecipeState, getArtificingCraftIngredients, getArtificingRecipePlayerTier, isArtifactArtificingRecipe } from '../../../game/systems/artificing/artificingSelectors'
import type { ArtificingRecipeId, EquipmentItemSlot } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { toggleArtificingRecipePin } from '../../../ui/preferences/uiPreferencesStore'
import type { ArtificingScreenPreferences } from '../../../ui/preferences/uiPreferencesTypes'
import { MAX_ARTIFICING_RECIPE_PINS } from '../../../ui/preferences/uiPreferencesTypes'
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
  const artifactRecipes = visible.filter(isArtifactArtificingRecipe)
  const equipmentRecipes = visible.filter(recipe => !isArtifactArtificingRecipe(recipe))

  const renderRecipeCard = (recipe: (typeof visible)[number]) => {
    const item = ITEMS[recipe.output.itemId]
    const owned = state.inventory[item.id] ?? 0
    const catalogState = getArtificingCatalogRecipeState(state, recipe.id)
    if (!catalogState) return null
    const { status, locked, active, activeForThis, materialReady, ownedArtifact } = catalogState
    const equipped = Object.values(state.equipment).includes(item.id)
    const artifact = catalogState.kind === 'artifact'
    const ingredients = getArtificingCraftIngredients(recipe.id) ?? []
    const recipeContext = status === 'FORGED' ? undefined : { status: status === 'LOCKED' ? 'Locked' : status === 'READY' ? 'Craftable' : status === 'MISSING' ? 'Missing materials' : status, outputQuantity: 1 as const, ingredients, unlockReason: locked ? getRecipeUnlockRequirement(recipe) ?? undefined : undefined }
    const craftDisabled = locked || ownedArtifact || !materialReady || active
    const craftDisabledReason = locked
      ? getRecipeUnlockRequirement(recipe) ?? 'Recipe locked'
      : ownedArtifact
        ? 'Artifact already forged'
        : activeForThis
          ? artifact ? 'This Artifact is already being forged' : 'This recipe is already being crafted'
          : !materialReady
            ? 'Missing materials'
            : active
              ? 'Another Artificing job is already active'
              : undefined
    const cardClassName = ['artificing-item-card', selected === recipe.id ? 'selected' : '', locked ? 'locked' : '', ownedArtifact ? 'artifact-forged' : '', activeForThis ? 'is-crafting' : ''].filter(Boolean).join(' ')
    const craftActions = artifact && ownedArtifact ? [] : [{ id: 'craft-one', label: 'Craft One', icon: Hammer, disabled: craftDisabled, disabledReason: craftDisabledReason, onSelect: () => { onSelect(recipe.id); state.craftArtificingRecipe(recipe.id) } }]
    const pinned = filters.pinnedRecipeIds.includes(recipe.id)
    const pinDisabled = !pinned && filters.pinnedRecipeIds.length >= MAX_ARTIFICING_RECIPE_PINS
    return <ItemTooltip key={recipe.id} itemId={item.id} owned={owned} recipeContext={recipeContext}>
      <button type="button" data-recipe-id={recipe.id} className={cardClassName} style={{ '--recipe-accent': item.color } as CSSProperties} aria-pressed={selected === recipe.id} onClick={() => onSelect(recipe.id)} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openContextMenu({ x: event.clientX, y: event.clientY, anchor: event.currentTarget, header: { title: recipe.name, meta: `${item.name} · ${status}` }, sections: [...(craftActions.length ? [{ id: 'craft', actions: craftActions }] : []), { id: 'recipe', actions: [{ id: 'pin', label: pinned ? 'Unpin Recipe' : 'Pin Recipe', icon: Pin, disabled: pinDisabled, disabledReason: pinDisabled ? `Maximum ${MAX_ARTIFICING_RECIPE_PINS} recipe pins.` : undefined, onSelect: () => toggleArtificingRecipePin(recipe.id) }, { id: 'compare', label: 'Compare Output', icon: Swords, onSelect: () => { setNavigationIntent({ equipmentItemId: item.id }); state.setScreen('equipment') } }, { id: 'inventory', label: 'Open in Inventory', icon: ShoppingBag, onSelect: () => { setNavigationIntent({ inventoryItemId: item.id }); state.setScreen('inventory') } }] }] }) }}>
        <span className="artificing-card-top">{locked && <LockKeyhole size={14} aria-label="Locked" />}{attention.unseenRecipes.includes(recipe.id) && <span className="archive-new-badge">NEW</span>}{ownedArtifact && <span className="artificing-forged-badge" aria-label="Forged Artifact"><Check size={11} /></span>}{equipped && <span className="artificing-equipped-badge" aria-label="Currently equipped">E</span>}</span>
        <ItemIcon itemId={item.id} size="tiny" /><strong>{item.name}</strong>
        <span className={`artificing-kind-badge ${artifact ? 'artifact' : 'equipment'}`}>{artifact ? `T${getArtificingRecipePlayerTier(recipe)} ARTIFACT` : 'EQUIPMENT'}</span>
        <span className="artificing-badge">{getArtificingProfile(recipe)}</span>
        {ownedArtifact && <span className="artificing-artifact-level">LV {catalogState.artifactLevel} / {catalogState.artifactMaxLevel}</span>}
        <Status tone={status === 'LOCKED' ? 'locked' : status === 'MISSING' ? 'warning' : status === 'READY' || status === 'FORGED' ? 'success' : 'active'}>{status}</Status>
      </button>
    </ItemTooltip>
  }

  const renderRecipeGroup = (title: 'ARTIFACTS' | 'EQUIPMENT', description: string, recipes: typeof visible) => <section className="artificing-recipe-group" aria-label={title}>
    <div className="artificing-recipe-group-head"><div><strong>{title}</strong><small>{description}</small></div><span>{recipes.length}</span></div>
    {recipes.length > 0 ? <div className="artificing-item-grid">{recipes.map(renderRecipeCard)}</div> : <div className="artificing-group-empty">No {title === 'ARTIFACTS' ? 'Artifact' : 'Equipment'} recipes match the current filters.</div>}
  </section>

  const groupedCatalog = filters.kindFilter === 'artifact'
    ? renderRecipeGroup('ARTIFACTS', 'Permanent items that grow through Artifact Path progression.', artifactRecipes)
    : filters.kindFilter === 'equipment'
      ? renderRecipeGroup('EQUIPMENT', 'Swappable crafted equipment.', equipmentRecipes)
      : <div className="artificing-recipe-groups">{renderRecipeGroup('ARTIFACTS', 'Permanent items that grow through Artifact Path progression.', artifactRecipes)}{renderRecipeGroup('EQUIPMENT', 'Swappable crafted equipment.', equipmentRecipes)}</div>
  const emptyMessage = filters.kindFilter === 'artifact' ? 'No Artifact recipes match the current filters.' : filters.kindFilter === 'equipment' ? 'No Equipment recipes match the current filters.' : 'No Artificing recipes match the current filters.'

  return <Card className="artificing-catalog" title="ARTIFICING CATALOG" action={<span className="artificing-count">{counts.visible} SHOWN</span>}>
    <div className="artificing-controls">
      <label className="artificing-search"><Search size={14} aria-hidden="true" /><SearchInput value={query} onChange={onQueryChange} placeholder="Search equipment..." /></label>
      <div className="artificing-filter-stack">
        <div className="artificing-kind-filter"><FilterRow label="CRAFT TYPE" options={(['all', 'artifact', 'equipment'] as const).map(value => ({ value, label: value === 'all' ? 'ALL' : value === 'artifact' ? 'ARTIFACTS' : 'EQUIPMENT' }))} value={filters.kindFilter} onChange={value => update({ kindFilter: value })} /></div>
        <FilterRow label="SLOT" options={slots.map(value => ({ value, label: value === 'all' ? 'ALL' : EQUIPMENT_ITEM_SLOT_LABELS[value].toUpperCase() }))} value={filters.slotFilter} onChange={value => update({ slotFilter: value })} />
        <FilterRow label="TIER" options={(['all', 1, 2, 3] as const).map(value => ({ value, label: value === 'all' ? 'ALL' : `T${value}` }))} value={filters.tierFilter} onChange={value => update({ tierFilter: value })} />
        <FilterRow label="OWNERSHIP" options={(['all', 'unowned', 'owned'] as const).map(value => ({ value, label: value.toUpperCase() }))} value={filters.ownershipFilter} onChange={value => update({ ownershipFilter: value })} />
        <GameTooltip content="Show only unlocked recipes with enough legally consumable ingredients. Protected, equipped, and reserved copies cannot be spent."><button type="button" className={`artificing-craftable-toggle ${filters.craftableOnly ? 'active' : ''}`} aria-pressed={filters.craftableOnly} onClick={() => update({ craftableOnly: !filters.craftableOnly })}><span aria-hidden="true">{filters.craftableOnly ? '☑' : '☐'}</span> CRAFTABLE <small>{counts.craftable}</small></button></GameTooltip>
      </div>
      {state.debug.showLockedArtificingRecipes && <div className="artificing-locked-banner"><LockKeyhole size={14} />DEV VIEW · Locked Artificing recipes revealed</div>}
    </div>
    <div ref={scroll} className="artificing-catalog-scroll smart-scroll-region">
      {visible.length === 0 ? <div className="empty-state small">{emptyMessage}</div> : groupedCatalog}
    </div>
  </Card>
}

export function FilterRow<T extends string | number>({ label, options, value, onChange }: { label: string; options: Array<{ value: T; label: string }>; value: T; onChange: (value: T) => void }) {
  return <div className="artificing-filter-row"><span className="artificing-filter-label">{label}</span><div className="artificing-filter-options" role="group" aria-label={label}>{options.map(option => <GameTooltip key={option.value} content={`Filter ${label.toLowerCase()}: ${option.label.toLowerCase()}`}><button type="button" className={value === option.value ? 'active' : ''} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button></GameTooltip>)}</div></div>
}
