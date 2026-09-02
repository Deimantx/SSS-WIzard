import { useEffect, useMemo, useState } from 'react'
import { Button, Card, FilterBar, Status, type FilterOption } from '../../components/ui'
import { ITEMS } from '../../game/content/items/items'
import { RECIPES, RECIPE_ORDER, type RecipeDefinition } from '../../game/content/recipes/recipes'
import { getRecipeConsumableRequirements, getRecipeCraftsPerHour, getRecipeCurrentEffectiveDuration, getRecipeStatus, getTransmutationEchoCapacity, getTransmutationEchoesAssigned } from '../../game/systems/transmutation/transmutationSelectors'
import type { RecipeCategory, RecipeId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { DeveloperBrowser, DeveloperBrowserLayout, DeveloperSection } from '../components/DeveloperBrowser'
import { NumberField, Summary } from './DeveloperTabPrimitives'

type RecipeFilter = 'all' | RecipeCategory
const FILTERS: readonly FilterOption<RecipeFilter>[] = [
  { value: 'all', label: 'ALL' },
  { value: 'elemental', label: 'ELEMENTAL' },
  { value: 'material', label: 'MATERIAL' },
  { value: 'equipment', label: 'EQUIPMENT' },
]
const recipeSearchText = (recipe: RecipeDefinition) => [recipe.id, recipe.name, recipe.category, recipe.output.itemId, recipe.ingredients.map((ingredient) => ingredient.itemId).join(' ')].join(' ').toLowerCase()

export function DeveloperTransmutation() {
  const state = useGameStore()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<RecipeFilter>('all')
  const [selected, setSelected] = useState<RecipeId>('fire-fragment')
  const recipeOptions = useMemo(() => RECIPE_ORDER.filter((id) => {
    const recipe = RECIPES[id]
    return (filter === 'all' || recipe.category === filter) && recipeSearchText(recipe).includes(query.trim().toLowerCase())
  }), [filter, query])
  useEffect(() => {
    if (recipeOptions.length > 0 && !recipeOptions.includes(selected)) setSelected(recipeOptions[0])
  }, [recipeOptions, selected])

  const recipe = RECIPES[selected]
  const job = state.activities.transmutation.jobs[selected]
  const status = getRecipeStatus(state, recipe)
  const requirements = getRecipeConsumableRequirements(state, recipe)
  const missingForOne = requirements.reduce((total, requirement) => total + Math.max(0, requirement.required - requirement.available), 0)
  const assigned = getTransmutationEchoesAssigned(state)
  const capacity = getTransmutationEchoCapacity(state)
  const setEchoes = state.setTransmutationEchoes
  const grantMissing = (cycles = 1) => state.grantTransmutationIngredients(selected, cycles)
  const removeIngredients = () => requirements.forEach((requirement) => state.removeItem(requirement.itemId, requirement.required))

  return <div className="developer-tab-stack">
    <Card title="Transmutation recipe browser" className="developer-browser-card">
      <div className="developer-filter-stack"><label>Search recipes<input aria-label="Search recipes" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, ID, output, ingredient..." /></label><div className="developer-filter-label">RECIPE CATEGORY<FilterBar options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Developer recipe filter" /></div></div>
      <DeveloperBrowserLayout browser={<><div className="developer-browser-heading"><strong>{recipeOptions.length} authored recipes</strong><small>Recipes and unlock rules remain runtime-authored.</small></div><DeveloperBrowser items={recipeOptions.map((id) => { const entry = RECIPES[id]; return { id, label: entry.name, icon: ITEMS[entry.output.itemId].icon, accent: ITEMS[entry.output.itemId].color, meta: `${id} · ${entry.category} · ${entry.output.quantity} ${ITEMS[entry.output.itemId].name}`, status: <Status tone={getRecipeStatus(state, entry) === 'locked' ? 'locked' : getRecipeStatus(state, entry) === 'active' ? 'success' : 'neutral'}>{getRecipeStatus(state, entry).toUpperCase()}</Status> } })} selectedId={selected} onSelect={(id) => setSelected(id as RecipeId)} emptyMessage="No matching recipes." /></>} inspector={recipeOptions.length > 0 ? <>
        <div className="developer-inspector-title"><span className="developer-browser-icon" style={{ color: ITEMS[recipe.output.itemId].color }}>{ITEMS[recipe.output.itemId].icon}</span><div><h2>{recipe.name}</h2><code>{recipe.id}</code></div><Status tone={status === 'locked' ? 'locked' : status === 'active' ? 'success' : 'neutral'}>{status.toUpperCase()}</Status></div>
        <DeveloperSection title="Recipe definition"><p className="muted">{recipe.description}</p><div className="developer-detail-grid"><span>OUTPUT<strong>{recipe.output.itemId} × {recipe.output.quantity}</strong></span><span>CATEGORY<strong>{recipe.category}</strong></span><span>DURATION<strong>{recipe.baseDurationMs} ms</strong></span><span>MANA<strong>{recipe.manaCost}</strong></span><span>ECHOES<strong>{job?.echoesAssigned ?? 0} / {capacity}</strong></span><span>CRAFTS / HOUR<strong>{getRecipeCraftsPerHour(recipe, job?.echoesAssigned ?? 0).toFixed(2)}</strong></span></div></DeveloperSection>
        <DeveloperSection title="Ingredients and missing quantities"><div className="developer-recipe-requirements">{requirements.length === 0 ? <span className="muted">No ingredients; this recipe creates its output from runtime Mana rules.</span> : requirements.map((requirement) => <div key={requirement.itemId}><span><strong>{ITEMS[requirement.itemId].name}</strong><small><code>{requirement.itemId}</code> · {requirement.owned} owned · {requirement.equipped} equipped · {requirement.protected ? 'protected' : `${requirement.available} available`}</small></span><strong className={requirement.available < requirement.required ? 'developer-missing-value' : ''}>{requirement.available} / {requirement.required}{requirement.available < requirement.required ? ` · missing ${requirement.required - requirement.available}` : ''}</strong></div>)}</div></DeveloperSection>
        <DeveloperSection title="Unlock and runtime state"><p className="developer-relation-line">{recipe.unlock.type === 'always' ? 'Always unlocked' : `Unlock rule: ${recipe.unlock.type}`}</p><div className="developer-detail-grid"><span>RUNNING JOB<strong>{job ? 'yes' : 'no'}</strong></span><span>PROGRESS<strong>{job ? `${Math.floor(job.progressMs)} / ${recipe.baseDurationMs} ms` : '0 ms'}</strong></span><span>EFFECTIVE DURATION<strong>{job ? `${getRecipeCurrentEffectiveDuration(recipe, job.echoesAssigned) ?? 0} ms` : 'paused'}</strong></span><span>MISSING FOR ONE<strong>{missingForOne}</strong></span></div></DeveloperSection>
        <DeveloperSection title="Recipe test actions"><div className="button-row"><Button onClick={() => grantMissing(1)}>Grant Missing Ingredients</Button><Button variant="secondary" onClick={() => grantMissing(10)}>Grant 10× Missing</Button><Button variant="ghost" onClick={removeIngredients} disabled={requirements.length === 0}>Remove Ingredients</Button><Button variant="secondary" onClick={() => setEchoes(selected, 1)}>Start / assign one Echo</Button><Button variant="ghost" onClick={() => setEchoes(selected, 0)}>Cancel / clear Echoes</Button><Button variant="success" onClick={() => state.completeTransmutationCycle(selected)}>DEBUG ONLY · Complete one cycle</Button><Button variant="danger" onClick={() => state.preset('chapter-complete')}>DEV FIXTURE · Unlock chapter</Button></div></DeveloperSection>
      </> : <div className="developer-browser-empty"><strong>No matching recipes</strong><small>Change the search or category filter.</small></div>} />
    </Card>
    <Card title="Transmutation runtime summary"><div className="developer-summary-grid"><Summary label="Assigned Echoes" value={`${assigned} / ${capacity}`} /><Summary label="Active jobs" value={Object.values(state.activities.transmutation.jobs).filter((entry) => (entry?.echoesAssigned ?? 0) > 0).length} /><Summary label="Selected status" value={status} /><Summary label="Selected progress" value={`${Math.floor(job?.progressMs ?? 0)} / ${recipe.baseDurationMs} ms`} /></div><p className="muted">Positive ingredient grants use the central item acquisition helper. The chapter fixture replaces the current gameplay state and is labeled as a destructive DEV setup.</p></Card>
  </div>
}
