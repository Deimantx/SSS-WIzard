import { useEffect } from 'react'
import { RECIPES, RECIPE_ORDER } from '../../../game/content/recipes/recipes'
import { ITEMS } from '../../../game/content/items/items'
import { isRecipeUnlocked } from '../../../game/systems/transmutation/transmutationSelectors'
import type { RecipeId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { EditableGrid, type EditableGridPanel } from '../../../ui/layout-editor/EditableGrid'
import { TowerFrame } from '../TowerFrame'
import { FocusAssignment } from './FocusAssignment'
import { OutputInspection } from './OutputInspection'
import { RecipeDetail } from './RecipeDetail'
import { RecipeLibrary } from './RecipeLibrary'
import { clearAttention } from '../../../ui/attention/attentionStore'
import { getActiveProfileId } from '../../../profiles/profileSessionStore'
import { InspectorTransition } from '../../../ui/game-feel/InspectorTransition'

export function TransmutationScreen() {
  const preferences = useUiPreferences()
  const state = useGameStore()
  const persistedRecipeId = preferences.screenState.transmutation.selectedRecipeId
  const persistedExists = Object.prototype.hasOwnProperty.call(RECIPES, persistedRecipeId)
  const persistedVisible = persistedExists && (state.debug.showLockedTransmutationRecipes || isRecipeUnlocked(state, RECIPES[persistedRecipeId as RecipeId]))
  const selectedRecipeId: RecipeId = persistedVisible ? persistedRecipeId as RecipeId : RECIPE_ORDER.find((recipeId) => isRecipeUnlocked(state, RECIPES[recipeId])) ?? RECIPE_ORDER[0]

  useEffect(() => {
    if (selectedRecipeId !== persistedRecipeId) setUiPreferences({ screenState: { transmutation: { selectedRecipeId } } })
  }, [persistedRecipeId, selectedRecipeId])

  const setSelectedRecipeId = (recipeId: RecipeId) => { clearAttention(getActiveProfileId(), 'recipe', recipeId); setUiPreferences({ screenState: { transmutation: { selectedRecipeId: recipeId } } }) }
  const recipe = RECIPES[selectedRecipeId]
  const panels: EditableGridPanel[] = [
    { id: 'transmutation-recipes', content: <RecipeLibrary selectedRecipeId={selectedRecipeId} onSelect={setSelectedRecipeId} /> },
    { id: 'transmutation-focus', content: <FocusAssignment selectedRecipeId={selectedRecipeId} onSelect={setSelectedRecipeId} /> },
    { id: 'transmutation-detail', content: <InspectorTransition identity={selectedRecipeId}><RecipeDetail recipe={recipe} onSelectRecipe={setSelectedRecipeId} /></InspectorTransition> },
  ]
  if (ITEMS[recipe.output.itemId].kind === 'equipment') panels.push({ id: 'transmutation-output-preview', content: <InspectorTransition identity={selectedRecipeId}><OutputInspection recipe={recipe} /></InspectorTransition> })

  return <TowerFrame eyebrow="WIZARD TOWER · TRANSMUTATION" title="Turn Mana and materials into matter." description="Assign Arcane Echoes to create elemental materials and equipment while the rest of the tower remains active."><EditableGrid screen="tower-transmutation" panels={panels} /></TowerFrame>
}
