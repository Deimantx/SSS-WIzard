import { useState } from 'react'
import { RECIPES, RECIPE_ORDER } from '../../../game/content/recipes/recipes'
import type { RecipeId } from '../../../game/types'
import { EditableGrid } from '../../../ui/layout-editor/EditableGrid'
import { TowerFrame } from '../TowerFrame'
import { FocusAssignment } from './FocusAssignment'
import { RecipeDetail } from './RecipeDetail'
import { RecipeLibrary } from './RecipeLibrary'

export function TransmutationScreen() {
  const [selectedRecipeId, setSelectedRecipeId] = useState<RecipeId>(RECIPE_ORDER[0])
  const recipe = RECIPES[selectedRecipeId]
  return <TowerFrame eyebrow="WIZARD TOWER · TRANSMUTATION" title="Turn Mana and materials into matter." description="Assign Arcane Echoes to create elemental materials and equipment while the rest of the tower remains active."><EditableGrid screen="tower-transmutation" panels={[{ id: 'transmutation-recipes', content: <RecipeLibrary selectedRecipeId={selectedRecipeId} onSelect={setSelectedRecipeId} /> }, { id: 'transmutation-detail', content: <RecipeDetail recipe={recipe} /> }, { id: 'transmutation-focus', content: <FocusAssignment selectedRecipeId={selectedRecipeId} /> }]} /></TowerFrame>
}
