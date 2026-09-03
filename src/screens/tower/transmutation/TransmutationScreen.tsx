import { useEffect } from 'react'
import { RECIPES, RECIPE_ORDER } from '../../../game/content/recipes/recipes'
import { isRecipeUnlocked } from '../../../game/systems/transmutation/transmutationSelectors'
import type { RecipeId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { EditableGrid } from '../../../ui/layout-editor/EditableGrid'
import { TowerFrame } from '../TowerFrame'
import { FocusAssignment } from './FocusAssignment'
import { OutputInspection } from './OutputInspection'
import { RecipeDetail } from './RecipeDetail'
import { RecipeLibrary } from './RecipeLibrary'

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

  const setSelectedRecipeId = (recipeId: RecipeId) => setUiPreferences({ screenState: { transmutation: { selectedRecipeId: recipeId } } })
  const recipe = RECIPES[selectedRecipeId]
  return <TowerFrame eyebrow="WIZARD TOWER · TRANSMUTATION" title="Turn Mana and materials into matter." description="Assign Arcane Echoes to create elemental materials and equipment while the rest of the tower remains active."><EditableGrid screen="tower-transmutation" panels={[{ id: 'transmutation-recipes', content: <RecipeLibrary selectedRecipeId={selectedRecipeId} onSelect={setSelectedRecipeId} /> }, { id: 'transmutation-focus', content: <FocusAssignment selectedRecipeId={selectedRecipeId} onSelect={setSelectedRecipeId} /> }, { id: 'transmutation-detail', content: <RecipeDetail recipe={recipe} /> }, { id: 'transmutation-output-preview', content: <OutputInspection recipe={recipe} /> }]} /></TowerFrame>
}
