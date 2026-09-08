import { ChevronDown, ChevronUp, Pin, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { GameTooltip } from '../ui/tooltip/Tooltip'
import { ItemIcon, ItemTooltip } from '../ui/item'
import { Status } from '../ui'
import { ITEMS } from '../../game/content/items/items'
import { ARTIFACTS } from '../../game/content/artifacts/artifacts'
import { ARTIFICING_RECIPES, type ArtificingRecipeDefinition } from '../../game/content/recipes/artificingRecipes'
import { isRecipeUnlocked } from '../../game/content/recipes/recipeUnlocks'
import { getActiveArtificingJob, getArtificingMissingIngredients, getArtificingProfile, getArtificingRecipePlayerTier } from '../../game/systems/artificing/artificingSelectors'
import { useGameStore } from '../../store/gameStore'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { setUiPreferences, unpinArtificingRecipe, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { MAX_ARTIFICING_RECIPE_PINS } from '../../ui/preferences/uiPreferencesTypes'
import type { ArtificingRecipeId, GameState } from '../../game/types'

export function RecipePinsDock() {
  const state = useGameStore()
  const preferences = useUiPreferences().screenState.artificing
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 900)
  const [narrowOpen, setNarrowOpen] = useState(false)
  const recipes = preferences.pinnedRecipeIds.map((id) => ARTIFICING_RECIPES[id]).filter((recipe): recipe is ArtificingRecipeDefinition => Boolean(recipe))

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia('(max-width: 900px)')
    const update = () => { setNarrow(media.matches); if (!media.matches) setNarrowOpen(false) }
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  if (!recipes.length) return null
  const collapsed = preferences.pinsCollapsed || (narrow && !narrowOpen)
  const toggleCollapsed = () => {
    if (narrow) {
      if (preferences.pinsCollapsed) { setUiPreferences({ screenState: { artificing: { pinsCollapsed: false } } }); setNarrowOpen(true) }
      else setNarrowOpen((open) => !open)
      return
    }
    setUiPreferences({ screenState: { artificing: { pinsCollapsed: !preferences.pinsCollapsed } } })
  }
  const openRecipe = (recipeId: ArtificingRecipeId) => {
    setUiPreferences({ screenState: { artificing: { selectedRecipeId: recipeId } } })
    setNavigationIntent({ artificingRecipeId: recipeId })
    state.setScreen('tower-artificing')
  }

  return <aside className={`recipe-pins-dock${collapsed ? ' is-collapsed' : ''}${narrow ? ' is-narrow' : ''}`} aria-label="Recipe Pins">
    <div className="recipe-pins-header">
      <div className="recipe-pins-heading"><Pin size={13} aria-hidden="true" /><strong>RECIPE PINS</strong><span>{recipes.length} / {MAX_ARTIFICING_RECIPE_PINS}</span></div>
      <div className="recipe-pins-header-actions">
        {!collapsed && <GameTooltip content="Clear all recipe pins."><button type="button" className="recipe-pins-clear" onClick={() => setUiPreferences({ screenState: { artificing: { pinnedRecipeIds: [] } } })}>CLEAR</button></GameTooltip>}
        <GameTooltip content={collapsed ? 'Expand Recipe Pins' : 'Collapse Recipe Pins'}><button type="button" className="recipe-pins-collapse" aria-label={collapsed ? 'Expand Recipe Pins' : 'Collapse Recipe Pins'} aria-expanded={!collapsed} onClick={toggleCollapsed}>{collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</button></GameTooltip>
      </div>
    </div>
    {!collapsed && <div className="recipe-pins-stack">{recipes.map((recipe) => <ArtificingRecipePinCard key={recipe.id} recipe={recipe} state={state} onOpen={() => openRecipe(recipe.id)} onUnpin={() => unpinArtificingRecipe(recipe.id)} />)}</div>}
  </aside>
}

function ArtificingRecipePinCard({ recipe, state, onOpen, onUnpin }: { recipe: ArtificingRecipeDefinition; state: GameState; onOpen: () => void; onUnpin: () => void }) {
  const item = ITEMS[recipe.output.itemId]
  const artifact = ARTIFACTS[recipe.output.itemId]
  const forged = Boolean(artifact && state.artifactProgress?.[recipe.id] && (state.inventory[recipe.output.itemId] ?? 0) > 0)
  const locked = !isRecipeUnlocked(state, recipe)
  const active = getActiveArtificingJob(state)
  const activeForThis = Boolean(active && (active.kind === 'recipe' ? active.recipeId === recipe.id : active.artifactId === recipe.id))
  const missing = forged || activeForThis ? [] : getArtificingMissingIngredients(state, recipe.id).filter((entry) => entry.missing > 0)
  const status = forged ? 'FORGED' : activeForThis ? 'CRAFTING' : locked ? 'LOCKED' : missing.length ? 'MISSING MATERIALS' : artifact ? 'READY TO FORGE' : 'READY TO CRAFT'
  const tone = forged || status.startsWith('READY') ? 'success' : locked ? 'locked' : activeForThis ? 'active' : 'warning'
  const profile = artifact ? `T${getArtificingRecipePlayerTier(recipe)} ARTIFACT` : `EQUIPMENT · ${getArtificingProfile(recipe)}`
  return <article className={`recipe-pins-card${forged ? ' is-forged' : ''}${locked ? ' is-locked' : ''}`}>
    <div className="recipe-pins-card-head">
      <ItemTooltip itemId={item.id} owned={state.inventory[item.id] ?? 0}>
        <button type="button" className="recipe-pins-identity" onClick={onOpen} aria-label={`Open ${recipe.name} in Artificing`}>
          <ItemIcon itemId={item.id} size="tiny" /><span><strong>{recipe.name}</strong><small>{profile}</small></span>
        </button>
      </ItemTooltip>
      <GameTooltip content={`Unpin ${recipe.name}.`}><button type="button" className="recipe-pins-unpin" aria-label={`Unpin ${recipe.name}`} onClick={onUnpin}><X size={13} /></button></GameTooltip>
    </div>
    <div className="recipe-pins-card-state"><Status tone={tone}>{status}</Status>{missing.length > 0 && <span className="recipe-pins-missing-label">MATERIALS STILL NEEDED</span>}</div>
    {missing.length > 0 && <div className="recipe-pins-materials">{missing.map((entry) => <MissingMaterialChip key={entry.itemId} itemId={entry.itemId} available={entry.available} required={entry.required} missing={entry.missing} protectedItem={Boolean(state.protectedItems[entry.itemId])} />)}</div>}
  </article>
}

function MissingMaterialChip({ itemId, available, required, missing, protectedItem }: { itemId: import('../../game/types').ItemId; available: number; required: number; missing: number; protectedItem: boolean }) {
  const item = ITEMS[itemId]
  return <ItemTooltip itemId={itemId} owned={available} protectedItem={protectedItem} extraContent={<div className="recipe-pins-ingredient-tooltip"><span>Required <b>{required.toLocaleString()}</b></span><span>Usable <b>{available.toLocaleString()}</b></span><span>Missing <b>{missing.toLocaleString()}</b></span></div>}>
    <span className="recipe-pins-material-chip" tabIndex={0} aria-label={`${item.name}. Missing ${missing}. ${available} usable, ${required} required.`}><ItemIcon itemId={itemId} size="tiny" /><b>{missing.toLocaleString()}</b></span>
  </ItemTooltip>
}
