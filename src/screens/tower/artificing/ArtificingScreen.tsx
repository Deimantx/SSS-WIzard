import { useEffect, useState } from 'react'
import { TowerFrame } from '../TowerFrame'
import { ARTIFICING_RECIPES } from '../../../game/content/recipes/artificingRecipes'
import { ITEMS } from '../../../game/content/items/items'
import { getVisibleArtificingRecipes } from '../../../game/systems/artificing/artificingSelectors'
import type { ArtificingRecipeId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { clearAttention } from '../../../ui/attention/attentionStore'
import { getActiveProfileId } from '../../../profiles/profileSessionStore'
import { EditableGrid } from '../../../ui/layout-editor/EditableGrid'
import { InspectorTransition } from '../../../ui/game-feel/InspectorTransition'
import { EquipmentCatalog } from './EquipmentCatalog'
import { ArtificingDetail } from './ArtificingDetail'
import { EquipmentInspection } from './EquipmentInspection'

export function ArtificingScreen() {
  const state = useGameStore()
  const preferences = useUiPreferences().screenState.artificing
  const [query, setQuery] = useState('')
  const visible = getVisibleArtificingRecipes(state, preferences, query)
  const selected = preferences.selectedRecipeId
  // Search/filter context never changes acquisition or the selected blueprint.
  // A hidden/invalid selection simply has no inspector until visible again.
  const recipe = selected && visible.some(entry => entry.id === selected) ? ARTIFICING_RECIPES[selected] : null
  useEffect(() => {
    if (selected && !Object.prototype.hasOwnProperty.call(ARTIFICING_RECIPES, selected)) setUiPreferences({ screenState: { artificing: { selectedRecipeId: null } } })
  }, [selected])
  const select = (id: ArtificingRecipeId) => {
    clearAttention(getActiveProfileId(), 'recipe', id)
    setUiPreferences({ screenState: { artificing: { selectedRecipeId: id } } })
  }
  const panels = [
    { id: 'artificing-catalog', content: <EquipmentCatalog selected={recipe?.id ?? null} onSelect={select} query={query} onQueryChange={setQuery} /> },
    { id: 'artificing-detail', content: <InspectorTransition identity={recipe?.id ?? 'none'} accent={recipe ? ITEMS[recipe.output.itemId].color : undefined}><ArtificingDetail recipe={recipe} /></InspectorTransition> },
  ]
  if (recipe) panels.push({ id: 'artificing-inspection', content: <InspectorTransition identity={recipe.id} accent={ITEMS[recipe.output.itemId].color}><EquipmentInspection key={recipe.id} recipe={recipe} /></InspectorTransition> })
  return <TowerFrame className="artificing-screen" eyebrow="WIZARD TOWER · ARTIFICING" title="Arcane Forge" description="Forge magical equipment from elemental and dungeon materials. Each craft creates exactly one item."><EditableGrid screen="tower-artificing" panels={panels} /></TowerFrame>
}
