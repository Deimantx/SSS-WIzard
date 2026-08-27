import { ChevronDown, ChevronRight, LockKeyhole, Search } from 'lucide-react'
import type { CSSProperties } from 'react'
import React from 'react'
import { Card, GameTooltip, Progress, SearchInput, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon, ItemQuantity } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import type { RecipeDefinition } from '../../../game/content/recipes/recipes'
import { getRecipeProgressPercent, getRecipeStatus, getRecipeUnlockReason, getTransmutationFocusReserved, getTransmutationJob, getTransmutationRecipeEntries, isRecipeCraftable, type TransmutationStatus } from '../../../game/systems/transmutation/transmutationSelectors'
import type { RecipeCategory, RecipeId } from '../../../game/types'
import { formatTime } from '../../../game/utils'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import type { TransmutationLibraryFilter } from '../../../ui/preferences/uiPreferencesTypes'
import { useGameStore } from '../../../store/gameStore'

const CATEGORY_LABELS: Record<RecipeCategory, string> = { elemental: 'ELEMENTAL', material: 'MATERIALS', equipment: 'EQUIPMENT', special: 'SPECIAL' }
const CATEGORY_ORDER: RecipeCategory[] = ['elemental', 'material', 'equipment', 'special']
const FILTER_LABELS: Record<TransmutationLibraryFilter, string> = { all: 'ALL', elemental: 'ELEMENTAL', material: 'MATERIALS', equipment: 'EQUIPMENT', special: 'SPECIAL', craftable: 'CRAFTABLE', active: 'ACTIVE' }

export function RecipeLibrary({ selectedRecipeId, onSelect }: { selectedRecipeId: RecipeId; onSelect: (recipeId: RecipeId) => void }) {
  const preferences = useUiPreferences()
  const [query, setQuery] = React.useState('')
  const recipes = getTransmutationRecipeEntries()
  const categories = CATEGORY_ORDER.filter((category) => recipes.some((recipe) => recipe.category === category))
  const savedFilter = preferences.screenState.transmutation.recipeFilter
  const filter = savedFilter !== 'all' && savedFilter !== 'craftable' && savedFilter !== 'active' && !categories.includes(savedFilter) ? 'all' : savedFilter
  const craftableKey = useGameStore((state) => filter === 'craftable' ? recipes.map((recipe) => isRecipeCraftable(state, recipe) ? '1' : '0').join('') : '')
  const activeKey = useGameStore((state) => filter === 'active' ? recipes.map((recipe) => (getTransmutationJob(state, recipe.id)?.echoesAssigned ?? 0) > 0 ? '1' : '0').join('') : '')
  const eligibleRecipeIds = new Set(recipes.filter((_, index) => (filter === 'craftable' ? craftableKey[index] : filter === 'active' ? activeKey[index] : '1') === '1').map((recipe) => recipe.id))
  const visible = recipes.filter((recipe) => matchesRecipe(recipe, query, filter, eligibleRecipeIds))
  const groups = filter === 'all' ? categories : categories.filter((category) => visible.some((recipe) => recipe.category === category))
  const collapsedCategories = preferences.screenState.transmutation.collapsedCategories
  const selectFilter = (nextFilter: TransmutationLibraryFilter) => setUiPreferences({ screenState: { transmutation: { recipeFilter: nextFilter } } })
  const toggleCategory = (category: RecipeCategory) => setUiPreferences({ screenState: { transmutation: { collapsedCategories: { [category]: !collapsedCategories[category] } } } })

  return <Card className="transmutation-library" title="RECIPE LIBRARY" action={<span className="transmutation-count">{visible.length} / {recipes.length}</span>}>
    <label className="transmutation-search"><Search size={14} aria-hidden="true" /><SearchInput value={query} onChange={setQuery} placeholder="Search recipes..." /></label>
    <div className="transmutation-filters" role="tablist" aria-label="Recipe filters">
      {(['all', ...categories, 'craftable', 'active'] as TransmutationLibraryFilter[]).map((entry) => <button type="button" role="tab" aria-selected={filter === entry} className={filter === entry ? 'active' : ''} key={entry} onClick={() => selectFilter(entry)}>{FILTER_LABELS[entry]}</button>)}
    </div>
    <div className="transmutation-library-list">
      {visible.length === 0 ? <div className="empty-state small">No recipes match this filter.</div> : groups.map((category) => {
        const categoryRecipes = visible.filter((recipe) => recipe.category === category)
        if (!categoryRecipes.length) return null
        const forceOpen = shouldRevealCategory(filter, query)
        const collapsed = collapsedCategories[category] && !forceOpen
        const contentId = `transmutation-${category}-recipes`
        const headingContent = <><span className="transmutation-group-heading-label">{CATEGORY_LABELS[category]}</span><span className="transmutation-group-heading-meta"><small>{categoryRecipes.length} RECIPES</small>{!forceOpen && (collapsed ? <ChevronRight size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />)}</span></>
        return <section className="transmutation-recipe-group" key={category}>{forceOpen ? <div className="transmutation-group-heading is-static" aria-label={`${CATEGORY_LABELS[category]}, ${categoryRecipes.length} recipes`}>{headingContent}</div> : <button type="button" className="transmutation-group-heading" aria-label={`${CATEGORY_LABELS[category]}, ${categoryRecipes.length} recipes`} aria-expanded={!collapsed} aria-controls={contentId} onClick={() => toggleCategory(category)}>{headingContent}</button>}{!collapsed && <div id={contentId} className="transmutation-recipe-grid">{categoryRecipes.map((recipe) => <RecipeTile key={recipe.id} recipe={recipe} selected={recipe.id === selectedRecipeId} onSelect={onSelect} />)}</div>}</section>
      })}
    </div>
  </Card>
}

function shouldRevealCategory(filter: TransmutationLibraryFilter, query: string) {
  return filter !== 'all' || query.trim().length > 0
}

function matchesRecipe(recipe: RecipeDefinition, query: string, filter: TransmutationLibraryFilter, eligibleRecipeIds: Set<RecipeId>) {
  const item = ITEMS[recipe.output.itemId]
  const search = query.trim().toLowerCase()
  if (search && !`${recipe.name} ${item.name} ${CATEGORY_LABELS[recipe.category]} ${recipe.description}`.toLowerCase().includes(search)) return false
  if (filter === 'craftable' || filter === 'active') return eligibleRecipeIds.has(recipe.id)
  return filter === 'all' || recipe.category === filter
}

function RecipeTile({ recipe, selected, onSelect }: { recipe: RecipeDefinition; selected: boolean; onSelect: (recipeId: RecipeId) => void }) {
  const item = ITEMS[recipe.output.itemId]
  const owned = useGameStore((state) => state.inventory[recipe.output.itemId] ?? 0)
  const echoes = useGameStore((state) => Math.max(0, Math.floor(getTransmutationJob(state, recipe.id)?.echoesAssigned ?? 0)))
  const progress = useGameStore((state) => getTransmutationJob(state, recipe.id)?.progressMs ?? 0)
  const status = useGameStore((state) => getRecipeStatus(state, recipe))
  const locked = status === 'locked'
  const tooltip = <TooltipContent title={recipe.name} description={`${item.name} ×${recipe.output.quantity} · ${formatTime(recipe.baseDurationMs)} base · ${recipe.manaCost} Mana`}><div className="tooltip-section"><small>INGREDIENTS</small><p>{recipe.ingredients.length ? recipe.ingredients.map((ingredient) => `${ITEMS[ingredient.itemId].name} ×${ingredient.quantity}`).join(' · ') : 'None — Mana only'}</p></div><div className="tooltip-section"><small>STATUS</small><p>{statusText(status)}{echoes > 0 ? ` · ${getTransmutationFocusReserved(echoes)} Focus reserved` : ''}</p></div>{locked && <p>{getRecipeUnlockReason(recipe)}</p>}</TooltipContent>
  return <GameTooltip block content={tooltip} accent={locked ? 'warning' : 'elemental'}><button type="button" aria-pressed={selected} className={`transmutation-recipe-tile ${selected ? 'selected' : ''} ${locked ? 'locked' : ''} ${echoes > 0 ? 'assigned' : ''}`} style={{ '--recipe-accent': item.color } as CSSProperties} onClick={() => onSelect(recipe.id)}>
    <span className="transmutation-tile-top">{locked ? <LockKeyhole size={13} aria-label="Locked" /> : <span aria-hidden="true" />}{echoes > 0 && <span className="transmutation-echo-badge">{echoes}E</span>}</span>
    <span className="transmutation-tile-icon"><ItemIcon itemId={recipe.output.itemId} size="tile" /></span>
    <strong>{recipe.name}</strong>
    <span className="transmutation-tile-owned"><ItemQuantity value={owned} compact /></span>
    {status !== 'paused' && <span className="transmutation-tile-status"><Status tone={locked ? 'locked' : status === 'active' ? 'active' : status === 'mana-limited' || status === 'waiting-mana' || status === 'waiting-materials' ? 'warning' : 'neutral'}>{statusText(status)}</Status></span>}
    {echoes > 0 && <Progress value={getRecipeProgressPercent(recipe, progress)} tone="gold" />}
  </button></GameTooltip>
}

function statusText(status: TransmutationStatus) {
  if (status === 'active') return 'ACTIVE'
  if (status === 'mana-limited') return 'MANA LIMITED'
  if (status === 'waiting-mana') return 'WAITING MANA'
  if (status === 'waiting-materials') return 'WAITING MATERIALS'
  if (status === 'locked') return 'LOCKED'
  return 'PAUSED'
}
