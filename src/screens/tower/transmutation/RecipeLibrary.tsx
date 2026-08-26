import React from 'react'
import { Search } from 'lucide-react'
import { GameTooltip, TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import { RECIPES, type RecipeDefinition } from '../../../game/content/recipes/recipes'
import { getRecipeProgressPercent, getRecipeStatus, getTransmutationFocusReserved, getTransmutationJob, getTransmutationRecipeEntries, isRecipeCraftable, type TransmutationStatus } from '../../../game/systems/transmutation/transmutationSelectors'
import type { GameState, RecipeCategory, RecipeId } from '../../../game/types'
import { formatTime } from '../../../game/utils'
import { useGameStore } from '../../../store/gameStore'
import { Card, Progress, SearchInput, Status } from '../../../components/ui'

type LibraryFilter = 'all' | 'craftable' | 'active' | RecipeCategory

const CATEGORY_LABELS: Record<RecipeCategory, string> = { elemental: 'ELEMENTAL', material: 'MATERIALS', equipment: 'EQUIPMENT', special: 'SPECIAL' }
const statusLabel = (status: TransmutationStatus, echoes: number) => status === 'active' ? echoes > 0 ? `${echoes} ECHO${echoes === 1 ? '' : 'ES'}` : 'ACTIVE' : status === 'waiting-mana' ? 'WAITING MANA' : status === 'waiting-materials' ? 'WAITING MATERIALS' : status === 'locked' ? 'LOCKED' : 'PAUSED'

export function RecipeLibrary({ selectedRecipeId, onSelect }: { selectedRecipeId: RecipeId; onSelect: (recipeId: RecipeId) => void }) {
  const state = useGameStore()
  const [query, setQuery] = React.useState('')
  const [filter, setFilter] = React.useState<LibraryFilter>('all')
  const recipes = getTransmutationRecipeEntries()
  const categories = (['elemental', 'material', 'equipment', 'special'] as RecipeCategory[]).filter((category) => recipes.some((recipe) => recipe.category === category))
  const visible = recipes.filter((recipe) => {
    const text = `${recipe.name} ${ITEMS[recipe.output.itemId].name}`.toLowerCase()
    if (query.trim() && !text.includes(query.trim().toLowerCase())) return false
    const job = getTransmutationJob(state, recipe.id)
    const status = getRecipeStatus(state, recipe)
    if (filter === 'craftable') return isRecipeCraftable(state, recipe)
    if (filter === 'active') return (job?.echoesAssigned ?? 0) > 0
    return filter === 'all' || recipe.category === filter
  })
  return <Card className="transmutation-library" title="RECIPE LIBRARY" action={<span className="transmutation-count">{visible.length} / {recipes.length}</span>}>
    <label className="transmutation-search"><Search size={14} /><SearchInput value={query} onChange={setQuery} placeholder="Search recipes..." /></label>
    <div className="transmutation-filters" role="tablist" aria-label="Recipe filters">
      {(['all', ...categories, 'craftable', 'active'] as LibraryFilter[]).map((entry) => <button type="button" role="tab" aria-selected={filter === entry} className={filter === entry ? 'active' : ''} key={entry} onClick={() => setFilter(entry)}>{entry === 'all' ? 'ALL' : entry === 'craftable' ? 'CRAFTABLE' : entry === 'active' ? 'ACTIVE' : CATEGORY_LABELS[entry]}</button>)}
    </div>
    <div className="transmutation-library-list">{visible.length === 0 ? <div className="empty-state small">No recipes match this filter.</div> : visible.map((recipe) => <RecipeLibraryItem key={recipe.id} state={state} recipe={recipe} selected={recipe.id === selectedRecipeId} onSelect={onSelect} />)}</div>
  </Card>
}

function RecipeLibraryItem({ state, recipe, selected, onSelect }: { state: GameState; recipe: RecipeDefinition; selected: boolean; onSelect: (recipeId: RecipeId) => void }) {
  const job = getTransmutationJob(state, recipe.id)
  const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? 0))
  const status = getRecipeStatus(state, recipe)
  const item = ITEMS[recipe.output.itemId]
  const tooltip = <TooltipContent title={recipe.name} description={`${item.name} ×${recipe.output.quantity} · ${formatTime(recipe.baseDurationMs)} base · ${recipe.manaCost} Mana`}><div className="tooltip-section"><small>INGREDIENTS</small><p>{recipe.ingredients.length ? recipe.ingredients.map((ingredient) => `${ITEMS[ingredient.itemId].name} ×${ingredient.quantity}`).join(' · ') : 'None — Mana only'}</p></div>{echoes > 0 && <div className="tooltip-section"><small>ARCANE ECHOES</small><p>{echoes} assigned · {getTransmutationFocusReserved(echoes)} Focus reserved</p></div>}</TooltipContent>
  return <GameTooltip block content={tooltip} accent={status === 'locked' ? 'warning' : 'elemental'}><button type="button" className={`transmutation-recipe-row ${selected ? 'selected' : ''} ${status === 'locked' ? 'locked' : ''}`} onClick={() => onSelect(recipe.id)}>
    <ItemIcon itemId={recipe.output.itemId} size="tile" /><span className="transmutation-recipe-copy"><strong>{recipe.name}</strong><small>{CATEGORY_LABELS[recipe.category]} · {item.name} ×{recipe.output.quantity}</small>{echoes > 0 && <Progress value={getRecipeProgressPercent(recipe, job?.progressMs ?? 0)} tone="gold" />}</span><span className="transmutation-recipe-state"><Status tone={status === 'active' ? 'active' : status === 'locked' ? 'locked' : status === 'waiting-mana' || status === 'waiting-materials' ? 'warning' : 'neutral'}>{statusLabel(status, echoes)}</Status><small>OWNED {state.inventory[recipe.output.itemId] ?? 0}</small></span>
  </button></GameTooltip>
}
