import { LockKeyhole, Search } from 'lucide-react'
import type { CSSProperties } from 'react'
import React from 'react'
import { Card, GameTooltip, Progress, SearchInput, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon, ItemQuantity } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import type { RecipeDefinition } from '../../../game/content/recipes/recipes'
import { getRecipeProgressPercent, getRecipeStatus, getRecipeUnlockReason, getTransmutationFocusReserved, getTransmutationJob, getTransmutationRecipeEntries, isRecipeCraftable, type TransmutationStatus } from '../../../game/systems/transmutation/transmutationSelectors'
import type { GameState, RecipeCategory, RecipeId } from '../../../game/types'
import { formatTime } from '../../../game/utils'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import type { TransmutationLibraryFilter } from '../../../ui/preferences/uiPreferencesTypes'
import { useGameStore } from '../../../store/gameStore'

const CATEGORY_LABELS: Record<RecipeCategory, string> = { elemental: 'ELEMENTAL', material: 'MATERIALS', equipment: 'EQUIPMENT', special: 'SPECIAL' }
const CATEGORY_ORDER: RecipeCategory[] = ['elemental', 'material', 'equipment', 'special']
const FILTER_LABELS: Record<TransmutationLibraryFilter, string> = { all: 'ALL', elemental: 'ELEMENTAL', material: 'MATERIALS', equipment: 'EQUIPMENT', special: 'SPECIAL', craftable: 'CRAFTABLE', active: 'ACTIVE' }

export function RecipeLibrary({ selectedRecipeId, onSelect }: { selectedRecipeId: RecipeId; onSelect: (recipeId: RecipeId) => void }) {
  const state = useGameStore()
  const preferences = useUiPreferences()
  const [query, setQuery] = React.useState('')
  const recipes = getTransmutationRecipeEntries()
  const categories = CATEGORY_ORDER.filter((category) => recipes.some((recipe) => recipe.category === category))
  const savedFilter = preferences.screenState.transmutation.recipeFilter
  const filter = savedFilter !== 'all' && savedFilter !== 'craftable' && savedFilter !== 'active' && !categories.includes(savedFilter) ? 'all' : savedFilter
  const visible = recipes.filter((recipe) => matchesRecipe(state, recipe, query, filter))
  const groups = filter === 'all' ? categories : categories.filter((category) => visible.some((recipe) => recipe.category === category))
  const selectFilter = (nextFilter: TransmutationLibraryFilter) => setUiPreferences({ screenState: { transmutation: { recipeFilter: nextFilter } } })

  return <Card className="transmutation-library" title="RECIPE LIBRARY" action={<span className="transmutation-count">{visible.length} / {recipes.length}</span>}>
    <label className="transmutation-search"><Search size={14} aria-hidden="true" /><SearchInput value={query} onChange={setQuery} placeholder="Search recipes..." /></label>
    <div className="transmutation-filters" role="tablist" aria-label="Recipe filters">
      {(['all', ...categories, 'craftable', 'active'] as TransmutationLibraryFilter[]).map((entry) => <button type="button" role="tab" aria-selected={filter === entry} className={filter === entry ? 'active' : ''} key={entry} onClick={() => selectFilter(entry)}>{FILTER_LABELS[entry]}</button>)}
    </div>
    <div className="transmutation-library-list">
      {visible.length === 0 ? <div className="empty-state small">No recipes match this filter.</div> : groups.map((category) => {
        const categoryRecipes = visible.filter((recipe) => recipe.category === category)
        if (!categoryRecipes.length) return null
        return <section className="transmutation-recipe-group" key={category}><div className="transmutation-group-heading"><span>{CATEGORY_LABELS[category]}</span><small>{categoryRecipes.length} RECIPES</small></div><div className="transmutation-recipe-grid">{categoryRecipes.map((recipe) => <RecipeTile key={recipe.id} state={state} recipe={recipe} selected={recipe.id === selectedRecipeId} onSelect={onSelect} />)}</div></section>
      })}
    </div>
  </Card>
}

function matchesRecipe(state: GameState, recipe: RecipeDefinition, query: string, filter: TransmutationLibraryFilter) {
  const item = ITEMS[recipe.output.itemId]
  const search = query.trim().toLowerCase()
  if (search && !`${recipe.name} ${item.name} ${CATEGORY_LABELS[recipe.category]} ${recipe.description}`.toLowerCase().includes(search)) return false
  if (filter === 'craftable') return isRecipeCraftable(state, recipe)
  if (filter === 'active') return (getTransmutationJob(state, recipe.id)?.echoesAssigned ?? 0) > 0
  return filter === 'all' || recipe.category === filter
}

function RecipeTile({ state, recipe, selected, onSelect }: { state: GameState; recipe: RecipeDefinition; selected: boolean; onSelect: (recipeId: RecipeId) => void }) {
  const item = ITEMS[recipe.output.itemId]
  const job = getTransmutationJob(state, recipe.id)
  const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? 0))
  const status = getRecipeStatus(state, recipe)
  const locked = status === 'locked'
  const tooltip = <TooltipContent title={recipe.name} description={`${item.name} ×${recipe.output.quantity} · ${formatTime(recipe.baseDurationMs)} base · ${recipe.manaCost} Mana`}><div className="tooltip-section"><small>INGREDIENTS</small><p>{recipe.ingredients.length ? recipe.ingredients.map((ingredient) => `${ITEMS[ingredient.itemId].name} ×${ingredient.quantity}`).join(' · ') : 'None — Mana only'}</p></div><div className="tooltip-section"><small>STATUS</small><p>{statusText(status, echoes)}{echoes > 0 ? ` · ${getTransmutationFocusReserved(echoes)} Focus reserved` : ''}</p></div>{locked && <p>{getRecipeUnlockReason(recipe)}</p>}</TooltipContent>
  return <GameTooltip block content={tooltip} accent={locked ? 'warning' : 'elemental'}><button type="button" aria-pressed={selected} className={`transmutation-recipe-tile ${selected ? 'selected' : ''} ${locked ? 'locked' : ''} ${echoes > 0 ? 'assigned' : ''}`} style={{ '--recipe-accent': item.color } as CSSProperties} onClick={() => onSelect(recipe.id)}>
    <span className="transmutation-tile-top">{locked ? <LockKeyhole size={13} aria-label="Locked" /> : <span aria-hidden="true" />}{echoes > 0 && <span className="transmutation-echo-badge">{echoes}E</span>}</span>
    <span className="transmutation-tile-icon"><ItemIcon itemId={recipe.output.itemId} size="tile" /></span>
    <strong>{recipe.name}</strong>
    <span className="transmutation-tile-owned"><ItemQuantity value={state.inventory[recipe.output.itemId] ?? 0} compact /></span>
    <span className="transmutation-tile-status"><Status tone={locked ? 'locked' : status === 'active' ? 'active' : status === 'waiting-mana' || status === 'waiting-materials' ? 'warning' : 'neutral'}>{statusText(status, echoes)}</Status></span>
    {echoes > 0 && <Progress value={getRecipeProgressPercent(recipe, job?.progressMs ?? 0)} tone="gold" />}
  </button></GameTooltip>
}

function statusText(status: TransmutationStatus, echoes: number) {
  if (status === 'active') return `${echoes}E ACTIVE`
  if (status === 'waiting-mana') return 'WAITING MANA'
  if (status === 'waiting-materials') return 'WAITING MATERIALS'
  if (status === 'locked') return 'LOCKED'
  return 'PAUSED'
}
