import { ARTIFICING_RECIPES } from '../../game/content/recipes/artificingRecipes'
import { getArtificingCraftCapacity, getArtificingMissingIngredients } from '../../game/systems/artificing/artificingSelectors'
import type { GameState, ArtificingRecipeId } from '../../game/types'
import { ITEMS } from '../../game/content/items/items'
import { useGameStore } from '../../store/gameStore'
import { useUiPreferences } from '../../ui/preferences/uiPreferencesStore'

export function PinnedRecipeTracker() {
  const state = useGameStore()
  const pinnedId = useUiPreferences().screenState.artificing.pinnedRecipeId
  if (!pinnedId) return null
  const recipe = ARTIFICING_RECIPES[pinnedId as ArtificingRecipeId]
  const progress = getArtificingMissingIngredients(state, pinnedId)
  const ready = progress.every(entry => entry.ready)
  return <aside className={`pinned-recipe-tracker ${ready ? 'pinned-ready' : ''}`} aria-label="Pinned Artificing recipe">
    <button type="button" onClick={() => { state.setScreen('tower-artificing') }}><strong>PINNED · {recipe.name}</strong><span>{ready ? 'READY TO CRAFT' : progress.filter(entry => entry.ready).length + '/' + progress.length + ' materials'}</span><small>{ready ? 'Open Artificing' : 'Capacity ' + getArtificingCraftCapacity(state, pinnedId)}</small></button>
  </aside>
}
