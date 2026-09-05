import { ChevronDown, ChevronRight, LockKeyhole, Search } from 'lucide-react'
import type { CSSProperties } from 'react'
import React from 'react'
import { Card, Progress, SearchInput, Status } from '../../../components/ui'
import { ItemIcon, ItemTooltip } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import type { RecipeDefinition } from '../../../game/content/recipes/recipes'
import { getRecipeProgressPercent, getRecipeStatus, getRecipeUnlockReason, getTransmutationFocusReserved, getTransmutationJob, getTransmutationRecipeEntries, getTransmutationRecipeFilterCounts, getTransmutationTierOptions, getVisibleTransmutationRecipes, type TransmutationRecipeFilters, type TransmutationStatus } from '../../../game/systems/transmutation/transmutationSelectors'
import type { RecipeCategory, TransmutationRecipeId } from '../../../game/types'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../../store/gameStore'
import { getTransmutationRecipeCardMeta } from '../../../game/presentation/transmutation/transmutationRecipeCardPresentation'
import { useProfileAttention } from '../../../ui/attention/attentionStore'
import { getActiveProfileId } from '../../../profiles/profileSessionStore'
import { useSmartScrollState } from '../../../ui/game-feel/useSmartScrollState'

const CATEGORY_LABELS: Record<RecipeCategory, string> = { elemental: 'ELEMENTAL', material: 'MATERIALS' }
const CATEGORY_ORDER: RecipeCategory[] = ['elemental', 'material']

export function RecipeLibrary({ selectedRecipeId, onSelect }: { selectedRecipeId: TransmutationRecipeId; onSelect: (recipeId: TransmutationRecipeId) => void }) {
  const preferences = useUiPreferences()
  const state = useGameStore()
  const attention = useProfileAttention(getActiveProfileId())
  const [query, setQuery] = React.useState('')
  const recipes = getTransmutationRecipeEntries()
  const saved = preferences.screenState.transmutation
  const filters: TransmutationRecipeFilters = {
    categoryFilter: saved.categoryFilter,
    tierFilter: saved.tierFilter,
    craftableOnly: saved.craftableOnly,
    activeOnly: saved.activeOnly,
  }
  const showLocked = state.debug.showLockedTransmutationRecipes
  const visible = getVisibleTransmutationRecipes(state, filters, query, showLocked)
  const counts = getTransmutationRecipeFilterCounts(state, filters, query, showLocked)
  const categories = CATEGORY_ORDER.filter((category) => recipes.some((recipe) => recipe.category === category))
  const groups = categories.filter((category) => visible.some((recipe) => recipe.category === category))
  const collapsedCategories = saved.collapsedCategories
  const tierCounts = filters.categoryFilter === 'elemental' || filters.categoryFilter === 'material' ? counts.tierCounts[filters.categoryFilter] : undefined
  const hasQuickFilters = filters.craftableOnly || filters.activeOnly
  const libraryScrollRef = React.useRef<HTMLDivElement>(null)
  useSmartScrollState(libraryScrollRef, { dependencies: [visible.map((recipe) => recipe.id).join('|'), query, filters.categoryFilter, filters.tierFilter, filters.craftableOnly, filters.activeOnly] })

  const update = (value: Partial<typeof filters>) => setUiPreferences({ screenState: { transmutation: value } })
  const toggleCategory = (category: RecipeCategory) => setUiPreferences({ screenState: { transmutation: { collapsedCategories: { [category]: !collapsedCategories[category] } } } })
  const forceOpen = filters.categoryFilter !== 'all' || query.trim().length > 0 || hasQuickFilters
  const emptyMessage = getEmptyMessage(filters, query, showLocked, counts)

  return <Card className="transmutation-library" title="RECIPE LIBRARY" action={<span className="transmutation-count">{visible.length} / {showLocked ? recipes.length : counts.unlocked}</span>}>
    <div className="transmutation-library-controls">
      <label className="transmutation-search"><Search size={14} aria-hidden="true" /><SearchInput value={query} onChange={setQuery} placeholder="Search recipes..." /></label>
      <div className="transmutation-filter-stack">
      <FilterRow label="CATEGORY" options={[{ value: 'all' as const, label: 'ALL', count: counts.categories.all }, ...categories.map(value => ({ value, label: CATEGORY_LABELS[value], count: counts.categories[value] }))]} value={filters.categoryFilter} onChange={value => update({ categoryFilter: value, tierFilter: 'all' })} />
      {getTransmutationTierOptions().length > 1 && (filters.categoryFilter === 'elemental' || filters.categoryFilter === 'material') && <FilterRow label={`${filters.categoryFilter === 'elemental' ? 'ELEMENT' : 'MATERIAL'} TIER`} options={(['all', ...getTransmutationTierOptions()] as const).map((value) => ({ value, label: value === 'all' ? 'ALL' : `T${value}`, count: value === 'all' ? counts.categories[filters.categoryFilter] : tierCounts?.[value] ?? 0 }))} value={filters.tierFilter} onChange={(value) => update({ tierFilter: value })} />}
      <div className="transmutation-filter-row transmutation-quick-filters"><div className="transmutation-quick-filter-label"><span className="transmutation-filter-label">SHOW ONLY</span><small>Combine filters</small></div><div className="transmutation-filter-options"><FilterToggle label="CRAFTABLE" pressed={filters.craftableOnly} count={counts.craftable} onClick={() => update({ craftableOnly: !filters.craftableOnly })} /><FilterToggle label="ACTIVE" pressed={filters.activeOnly} count={counts.active} onClick={() => update({ activeOnly: !filters.activeOnly })} />{hasQuickFilters && <button type="button" className="transmutation-quick-filter-clear" aria-label="Clear Show Only filters" onClick={() => update({ craftableOnly: false, activeOnly: false })}>CLEAR</button>}</div></div>
      </div>
      {showLocked && counts.hiddenLocked > 0 && <div className="transmutation-locked-banner"><LockKeyhole size={14} aria-hidden="true" /><span>DEV VIEW · {counts.hiddenLocked} locked recipes revealed. Unlock conditions still apply.</span></div>}
    </div>
    <div ref={libraryScrollRef} className="transmutation-library-scroll smart-scroll-region">
      {visible.length === 0 ? <div className="empty-state small">{emptyMessage}</div> : groups.map((category) => {
        const categoryRecipes = visible.filter((recipe) => recipe.category === category)
        const collapsed = collapsedCategories[category] && !forceOpen
        const contentId = `transmutation-${category}-recipes`
        const headingContent = <><span className="transmutation-group-heading-label">{CATEGORY_LABELS[category]}</span><span className="transmutation-group-heading-meta"><small>{categoryRecipes.length} RECIPES</small>{!forceOpen && (collapsed ? <ChevronRight size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />)}</span></>
        return <section className="transmutation-recipe-group" key={category}>{forceOpen ? <div className="transmutation-group-heading is-static" aria-label={`${CATEGORY_LABELS[category]}, ${categoryRecipes.length} recipes`}>{headingContent}</div> : <button type="button" className="transmutation-group-heading" aria-label={`${CATEGORY_LABELS[category]}, ${categoryRecipes.length} recipes`} aria-expanded={!collapsed} aria-controls={contentId} onClick={() => toggleCategory(category)}>{headingContent}</button>}{!collapsed && <div id={contentId} className="transmutation-recipe-grid">{categoryRecipes.map((recipe) => <RecipeTile key={recipe.id} recipe={recipe} selected={recipe.id === selectedRecipeId} newRecipe={attention.unseenRecipes.includes(recipe.id)} onSelect={onSelect} />)}</div>}</section>
      })}
    </div>
  </Card>
}

function FilterRow<T extends string | number>({ label, options, value, onChange }: { label: string; options: Array<{ value: T; label: string; count: number }>; value: T; onChange: (value: T) => void }) {
  return <div className="transmutation-filter-row"><span className="transmutation-filter-label">{label}</span><div className="transmutation-filter-options">{options.map((option) => <button type="button" role="tab" aria-label={option.label} key={String(option.value)} aria-pressed={value === option.value} aria-selected={value === option.value} className={value === option.value ? 'active' : ''} onClick={() => onChange(option.value)}><span>{option.label}</span><small>{option.count}</small></button>)}</div></div>
}

function FilterToggle({ label, pressed, count, onClick }: { label: string; pressed: boolean; count: number; onClick: () => void }) {
  return <button type="button" aria-label={label} aria-pressed={pressed} className={`transmutation-quick-filter ${pressed ? 'active' : ''}`} onClick={onClick}><span className="transmutation-quick-filter-icon" aria-hidden="true">{pressed ? '✓' : ''}</span><span>{label}</span><small>{count}</small></button>
}

function getEmptyMessage(filters: TransmutationRecipeFilters, query: string, showLocked: boolean, counts: ReturnType<typeof getTransmutationRecipeFilterCounts>) {
  const normalizedQuery = query.trim()
  if (normalizedQuery) return `No recipes match "${normalizedQuery}"${hasActiveContextFilter(filters) ? ' within the selected filters' : ''}.`
  if (!showLocked && counts.unlocked === 0) return 'No recipes are unlocked yet.'
  if (filters.craftableOnly) return 'No unlocked recipes are craftable with the current Mana and materials.'
  if (filters.activeOnly) return 'No recipes currently have Arcane Echoes assigned.'
  if ((filters.categoryFilter === 'elemental' || filters.categoryFilter === 'material') && filters.tierFilter !== 'all') return `No T${filters.tierFilter} ${filters.categoryFilter} recipes are available.`
  return 'No recipes match this filter.'
}

function hasActiveContextFilter(filters: TransmutationRecipeFilters) {
  return filters.categoryFilter !== 'all' || filters.tierFilter !== 'all' || filters.craftableOnly || filters.activeOnly
}

function RecipeTile({ recipe, selected, newRecipe = false, onSelect }: { recipe: RecipeDefinition; selected: boolean; newRecipe?: boolean; onSelect: (recipeId: TransmutationRecipeId) => void }) {
  const state = useGameStore()
  const item = ITEMS[recipe.output.itemId]
  const owned = state.inventory[recipe.output.itemId] ?? 0
  const echoes = Math.max(0, Math.floor(getTransmutationJob(state, recipe.id)?.echoesAssigned ?? 0))
  const progress = getTransmutationJob(state, recipe.id)?.progressMs ?? 0
  const status = getRecipeStatus(state, recipe)
  const locked = status === 'locked'
  const cardMeta = getTransmutationRecipeCardMeta(item)
  return <ItemTooltip itemId={recipe.output.itemId} owned={owned} recipeContext={{ status: statusText(status), baseDurationMs: recipe.baseDurationMs, manaCost: recipe.manaCost, outputQuantity: recipe.output.quantity, ingredients: recipe.ingredients.map((ingredient) => ({ itemId: ingredient.itemId, quantity: ingredient.quantity })), unlockReason: locked ? getRecipeUnlockReason(recipe) ?? undefined : undefined }}>
    <button type="button" data-recipe-id={recipe.id} aria-pressed={selected} className={`transmutation-recipe-tile ${selected ? 'selected' : ''} ${locked ? 'locked' : ''} ${echoes > 0 ? 'assigned' : ''}`} style={{ '--recipe-accent': item.color } as CSSProperties} onClick={() => onSelect(recipe.id)}>
      <span className="transmutation-tile-top">{locked ? <LockKeyhole size={13} aria-label="Locked" /> : <span aria-hidden="true" />}{echoes > 0 && <span className="transmutation-echo-badge">{echoes}E</span>}</span>
      <span className="transmutation-tile-icon"><ItemIcon itemId={recipe.output.itemId} size="tile" /></span>
      <strong>{recipe.name}</strong>
      {newRecipe && <span className="archive-new-badge recipe-new-badge">NEW</span>}
      <span className="transmutation-tile-badges" aria-label={cardMeta.badges.join(', ')}>{cardMeta.badges.map((badge, index) => <span className={`transmutation-badge ${cardMeta.tier !== null && index === 0 ? 'tier' : ''}`} key={badge}>{badge}</span>)}</span>
      <span className="transmutation-tile-footer"><span className="transmutation-tile-owned">OWNED {formatOwned(owned)}</span>{status !== 'paused' && <span className="transmutation-tile-status"><Status tone={locked ? 'locked' : status === 'active' ? 'active' : status === 'mana-limited' || status === 'waiting-mana' || status === 'waiting-materials' ? 'warning' : 'neutral'}>{statusText(status)}</Status></span>}</span>
      {echoes > 0 && <Progress value={getRecipeProgressPercent(recipe, progress)} tone="gold" running={status === 'active' || status === 'mana-limited'} />}
    </button>
  </ItemTooltip>
}

function formatOwned(value: number) {
  return Math.max(0, Math.floor(value)).toLocaleString()
}

function statusText(status: TransmutationStatus) {
  if (status === 'active') return 'ACTIVE'
  if (status === 'mana-limited') return 'MANA LIMITED'
  if (status === 'waiting-mana') return 'WAITING MANA'
  if (status === 'waiting-materials') return 'WAITING MATERIALS'
  if (status === 'locked') return 'LOCKED'
  return 'PAUSED'
}
