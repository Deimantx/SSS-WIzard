import { Pin, PinOff } from 'lucide-react'
import { Button } from '../ui'
import { canPinArtificingRecipe, toggleArtificingRecipePin, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { MAX_ARTIFICING_RECIPE_PINS } from '../../ui/preferences/uiPreferencesTypes'
import { ARTIFICING_RECIPES } from '../../game/content/recipes/artificingRecipes'
import type { ArtificingRecipeId } from '../../game/types'

export function ArtificingRecipePinButton({ recipeId }: { recipeId: ArtificingRecipeId }) {
  const preferences = useUiPreferences().screenState.artificing
  const recipeName = ARTIFICING_RECIPES[recipeId]?.name ?? recipeId
  const pinned = preferences.pinnedRecipeIds.includes(recipeId)
  const limitReached = !pinned && (!canPinArtificingRecipe(recipeId) || preferences.pinnedRecipeIds.length >= MAX_ARTIFICING_RECIPE_PINS)
  const tooltip = pinned ? 'Unpin this recipe.' : limitReached ? `Maximum ${MAX_ARTIFICING_RECIPE_PINS} recipe pins.` : 'Pin this recipe to the Recipe Pins tracker.'
  return <Button
    className={`artificing-recipe-pin-button${pinned ? ' is-pinned' : ''}`}
    variant={pinned ? 'secondary' : 'ghost'}
    disabled={limitReached}
    tooltip={tooltip}
    ariaLabel={pinned ? `Unpin ${recipeName}` : `Pin ${recipeName}`}
    onClick={() => toggleArtificingRecipePin(recipeId)}
  >
    {pinned ? <PinOff size={13} aria-hidden="true" /> : <Pin size={13} aria-hidden="true" />}
    <span>{pinned ? 'UNPIN' : 'PIN'}</span>
  </Button>
}
