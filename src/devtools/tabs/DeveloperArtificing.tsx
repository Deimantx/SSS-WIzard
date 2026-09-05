import { useEffect, useMemo, useState } from 'react'
import { Button, Card, FilterBar, SearchInput, Status, type FilterOption } from '../../components/ui'
import { ItemIcon, ItemTooltip } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { getVisibleArtificingRecipes, DEFAULT_ARTIFICING_FILTERS, canCraftArtificingRecipe, getArtificingProfile, getArtificingUnlockReason, type ArtificingFilters } from '../../game/systems/artificing/artificingSelectors'
import { ARTIFICING_RECIPES } from '../../game/content/recipes/artificingRecipes'
import { isRecipeUnlocked } from '../../game/content/recipes/recipeUnlocks'
import { getConsumableQuantity } from '../../game/core/inventory/inventoryConsumption'
import type { ArtificingRecipeId, EquipmentItemSlot } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { DeveloperAdvancedSection, DeveloperBrowser, DeveloperBrowserLayout, DeveloperSection } from '../components/DeveloperBrowser'

type DevFilter = 'all' | 'unlocked' | 'locked' | 'craftable' | 'missing'
const slots: readonly FilterOption<'all' | EquipmentItemSlot>[] = [{ value: 'all', label: 'ALL' }, ...(['weapon', 'offhand', 'armor', 'helmet', 'cape', 'amulet', 'ring'] as const).map(value => ({ value, label: value.toUpperCase() }))]
const hands: readonly FilterOption<'all' | '1' | '2'>[] = [{ value: 'all', label: 'ALL' }, { value: '1', label: '1H' }, { value: '2', label: '2H' }]
const offhands: readonly FilterOption<'all' | 'shield' | 'focus'>[] = [{ value: 'all', label: 'ALL' }, { value: 'shield', label: 'SHIELD' }, { value: 'focus', label: 'FOCUS' }]
const ownership: readonly FilterOption<'all' | 'owned' | 'unowned'>[] = [{ value: 'all', label: 'ALL' }, { value: 'unowned', label: 'UNOWNED' }, { value: 'owned', label: 'OWNED' }]
const statuses: readonly FilterOption<DevFilter>[] = [{ value: 'all', label: 'ALL' }, { value: 'unlocked', label: 'UNLOCKED' }, { value: 'locked', label: 'LOCKED' }]
const craftability: readonly FilterOption<DevFilter>[] = [{ value: 'all', label: 'ALL' }, { value: 'craftable', label: 'CRAFTABLE' }, { value: 'missing', label: 'MISSING MATERIALS' }]
export function DeveloperArtificing() {
  const state = useGameStore()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ArtificingRecipeId>('ember-staff')
  const [filters, setFilters] = useState<ArtificingFilters>(DEFAULT_ARTIFICING_FILTERS)
  const [unlockFilter, setUnlockFilter] = useState<DevFilter>('all')
  const [craftFilter, setCraftFilter] = useState<DevFilter>('all')
  const allVisible = getVisibleArtificingRecipes(state, filters, query, true)
  const visible = useMemo(() => allVisible.filter(recipe => { const unlocked = isRecipeUnlocked(state, recipe); const craftable = canCraftArtificingRecipe(state, recipe.id); return (unlockFilter === 'all' || unlockFilter === (unlocked ? 'unlocked' : 'locked')) && (craftFilter === 'all' || craftFilter === (craftable ? 'craftable' : 'missing')) }), [allVisible, state, unlockFilter, craftFilter])
  useEffect(() => { if (visible.length > 0 && !visible.some(recipe => recipe.id === selected)) setSelected(visible[0].id) }, [visible, selected])
  const recipe = ARTIFICING_RECIPES[selected]
  const selectedRecipe = visible.some(entry => entry.id === selected) ? recipe : null
  const unlocked = isRecipeUnlocked(state, recipe)
  const craftable = selectedRecipe ? canCraftArtificingRecipe(state, selected) : false
  const grantMissing = () => state.grantArtificingIngredients(selected)
  return <Card title="Artificing Equipment browser" className="developer-browser-card">
    <div className="developer-filter-stack"><SearchInput value={query} onChange={setQuery} placeholder="Search Equipment recipes..." /><div className="developer-filter-label">SLOT<FilterBar options={slots} value={filters.slotFilter} onChange={value => setFilters(current => ({ ...current, slotFilter: value, weaponHandsFilter: 'all', offhandPresentationFilter: 'all' }))} ariaLabel="Developer Artificing slot" /></div>{filters.slotFilter === 'weapon' && <div className="developer-filter-label">HANDS<FilterBar options={hands} value={String(filters.weaponHandsFilter) as 'all' | '1' | '2'} onChange={value => setFilters(current => ({ ...current, weaponHandsFilter: value === 'all' ? 'all' : Number(value) as 1 | 2 }))} ariaLabel="Developer Artificing hands" /></div>}{filters.slotFilter === 'offhand' && <div className="developer-filter-label">OFFHAND TYPE<FilterBar options={offhands} value={filters.offhandPresentationFilter} onChange={value => setFilters(current => ({ ...current, offhandPresentationFilter: value }))} ariaLabel="Developer Artificing offhand type" /></div>}<div className="developer-filter-label">OWNERSHIP<FilterBar options={ownership} value={filters.ownershipFilter} onChange={value => setFilters(current => ({ ...current, ownershipFilter: value }))} ariaLabel="Developer Artificing ownership" /></div><div className="developer-filter-label">UNLOCK STATUS<FilterBar options={statuses} value={unlockFilter} onChange={setUnlockFilter} ariaLabel="Developer Artificing unlock status" /></div><div className="developer-filter-label">CRAFTABILITY<FilterBar options={craftability} value={craftFilter} onChange={setCraftFilter} ariaLabel="Developer Artificing craftability" /></div><div className="developer-debug-toggle"><Button variant={state.debug.showLockedArtificingRecipes ? 'secondary' : 'ghost'} tooltip="Reveal locked Artificing recipes on the game screen for inspection. Normal crafting still requires the authored unlock." onClick={() => state.setDebugShowLockedArtificingRecipes(!state.debug.showLockedArtificingRecipes)}>{state.debug.showLockedArtificingRecipes ? 'HIDE LOCKED EQUIPMENT RECIPES' : 'SHOW LOCKED EQUIPMENT RECIPES'}</Button><small>This does not unlock normal crafting. The tester browser always lists all authored Equipment.</small></div></div>
    <DeveloperBrowserLayout browser={<><div className="developer-browser-heading"><strong>{visible.length} / 27 Equipment recipes</strong></div><DeveloperBrowser items={visible.map(entry => ({ id: entry.id, label: entry.name, icon: ITEMS[entry.output.itemId].icon, meta: DUNGEONS[entry.sourceDungeonId].name, status: <Status tone={isRecipeUnlocked(state, entry) ? 'neutral' : 'locked'}>{isRecipeUnlocked(state, entry) ? 'UNLOCKED' : 'LOCKED'}</Status> }))} selectedId={selected} onSelect={id => setSelected(id as ArtificingRecipeId)} emptyMessage="No matching Equipment." /></>} inspector={selectedRecipe ? <>
      <div className="developer-inspector-title"><ItemIcon itemId={recipe.output.itemId} size="tile" /><div><h2>{recipe.name}</h2><small>{getArtificingProfile(recipe)} · {DUNGEONS[recipe.sourceDungeonId].name}</small></div><Status tone={unlocked ? 'neutral' : 'locked'}>{unlocked ? 'UNLOCKED' : 'LOCKED'}</Status></div>
      <DeveloperSection title="Recipe and ownership"><p>{recipe.description}</p><p>Owned: {state.inventory[recipe.output.itemId] ?? 0} · Output: 1</p><p>{getArtificingUnlockReason(recipe) ?? 'Always available'}</p></DeveloperSection>
      <DeveloperSection title="Ingredients"><div className="developer-recipe-requirements">{recipe.ingredients.map(ingredient => { const available = getConsumableQuantity(state, ingredient.itemId); return <ItemTooltip key={ingredient.itemId} itemId={ingredient.itemId} owned={state.inventory[ingredient.itemId] ?? 0} protectedItem={state.protectedItems[ingredient.itemId]}><div tabIndex={0}><span>{ITEMS[ingredient.itemId].name}</span><strong>{available} / {ingredient.quantity}</strong><small>Missing {Math.max(0, ingredient.quantity - available)}</small></div></ItemTooltip> })}</div></DeveloperSection>
      <DeveloperSection title="Test actions"><div className="button-row"><Button tooltip="Grant only missing legal ingredients for one craft through central acquisition." onClick={grantMissing}>GRANT MISSING</Button><Button variant="ghost" tooltip="Remove one recipe worth of available ingredients using inventory rules." onClick={() => recipe.ingredients.forEach(i => state.removeItem(i.itemId, i.quantity))}>REMOVE INGREDIENTS</Button><Button variant="success" disabled={!craftable} tooltip="Craft one item with normal unlock and ingredient rules." onClick={() => state.craftArtificingRecipe(selected)}>CRAFT ONCE</Button><Button variant="secondary" tooltip="Developer cheat: grant one output directly, without paying or unlocking its recipe." onClick={() => state.addItem(recipe.output.itemId, 1)}>GRANT OUTPUT (CHEAT)</Button></div></DeveloperSection>
      <DeveloperAdvancedSection title="Advanced recipe details"><code>{recipe.id}</code></DeveloperAdvancedSection>
    </> : <div className="developer-browser-empty"><strong>No matching Equipment</strong><small>Change the search or filters.</small></div>} />
  </Card>
}
