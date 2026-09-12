import { useEffect } from 'react'
import { TRANSMUTATION_RECIPES as RECIPES, TRANSMUTATION_RECIPE_ORDER as RECIPE_ORDER } from '../../../game/content/recipes/recipes'
import { ITEMS } from '../../../game/content/items/items'
import { isRecipeUnlocked } from '../../../game/systems/transmutation/transmutationSelectors'
import type { TransmutationRecipeId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { ScreenGrid, type ScreenGridPanel } from '../../../components/layout/ScreenGrid'
import { TowerFrame } from '../TowerFrame'
import { FocusAssignment } from './FocusAssignment'
import { RecipeDetail } from './RecipeDetail'
import { RecipeLibrary } from './RecipeLibrary'
import { clearAttention } from '../../../ui/attention/attentionStore'
import { getActiveProfileId } from '../../../profiles/profileSessionStore'
import { InspectorTransition } from '../../../ui/game-feel/InspectorTransition'
import { setNavigationIntent, useNavigationIntent } from '../../../ui/navigation/navigationIntent'
import { TransmutationArraysPanel } from './TransmutationArraysPanel'

export function TransmutationScreen() {
  const preferences = useUiPreferences()
  const state = useGameStore()
  const navigationIntent = useNavigationIntent()
  const persistedRecipeId = preferences.screenState.transmutation.selectedRecipeId
  const intentRecipeId = navigationIntent.transmutationRecipeId && Object.prototype.hasOwnProperty.call(RECIPES, navigationIntent.transmutationRecipeId) ? navigationIntent.transmutationRecipeId : null
  const requestedRecipeId = intentRecipeId ?? persistedRecipeId
  const requestedExists = Object.prototype.hasOwnProperty.call(RECIPES, requestedRecipeId)
  const requestedVisible = requestedExists && (Boolean(intentRecipeId) || state.debug.showLockedTransmutationRecipes || isRecipeUnlocked(state, RECIPES[requestedRecipeId as TransmutationRecipeId]))
  const selectedRecipeId: TransmutationRecipeId = requestedVisible ? requestedRecipeId as TransmutationRecipeId : RECIPE_ORDER.find((recipeId) => isRecipeUnlocked(state, RECIPES[recipeId])) ?? RECIPE_ORDER[0]

  useEffect(() => {
    if (intentRecipeId) {
      setUiPreferences({ screenState: { transmutation: { selectedRecipeId: intentRecipeId, categoryFilter: 'all', tierFilter: 'all', craftableOnly: false, activeOnly: false } } })
      setNavigationIntent({ transmutationRecipeId: null })
      return
    }
    if (selectedRecipeId !== persistedRecipeId) setUiPreferences({ screenState: { transmutation: { selectedRecipeId } } })
  }, [intentRecipeId, persistedRecipeId, selectedRecipeId])

  const setSelectedRecipeId = (recipeId: TransmutationRecipeId) => { clearAttention(getActiveProfileId(), 'recipe', recipeId); setUiPreferences({ screenState: { transmutation: { selectedRecipeId: recipeId } } }) }
  const recipe = RECIPES[selectedRecipeId]
  const panels: ScreenGridPanel[] = [
    { id: 'transmutation-recipes', content: <RecipeLibrary selectedRecipeId={selectedRecipeId} onSelect={setSelectedRecipeId} /> },
    { id: 'transmutation-focus', content: <FocusAssignment selectedRecipeId={selectedRecipeId} onSelect={setSelectedRecipeId} /> },
    { id: 'transmutation-detail', content: <InspectorTransition identity={selectedRecipeId} accent={ITEMS[recipe.output.itemId].color}><RecipeDetail recipe={recipe} onSelectRecipe={setSelectedRecipeId} /></InspectorTransition> },
    { id: 'transmutation-arrays', content: <TransmutationArraysPanel /> },
  ]
  return <TowerFrame eyebrow="WIZARD TOWER · TRANSMUTATION" title="Shape Mana into elemental matter." description="Assign Arcane Echoes to continuously create elemental fragments, prismatic matter, and future elemental tiers."><ScreenGrid screen="tower-transmutation" panels={panels} /></TowerFrame>
}
