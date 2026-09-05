import { Button } from '../../../components/ui'
import { ITEMS } from '../../../game/content/items/items'
import { ARTIFICING_RECIPES } from '../../../game/content/recipes/artificingRecipes'
import { useGameStore } from '../../../store/gameStore'

export function ActiveArtificingCraft() {
  const activity = useGameStore(state => state.activities.artificing)
  const cancel = useGameStore(state => state.cancelArtificingCraft)
  const recipe = activity.activeRecipeId ? ARTIFICING_RECIPES[activity.activeRecipeId] : null
  if (!recipe) return null
  return <div className="artificing-active-craft">
    <span className="eyebrow">CRAFTING · {ITEMS[recipe.output.itemId].name}</span>
    <div className="artificing-progress-track"><div className="artificing-progress-fill" style={{ width: Math.min(100, activity.progressMs / recipe.baseDurationMs * 100) + '%' }} /></div>
    <div className="artificing-craft-actions">
      <small>{(activity.progressMs / 1000).toFixed(1)}s / {(recipe.baseDurationMs / 1000).toFixed(1)}s</small>
      <Button variant="ghost" tooltip="Cancel this craft and return all committed materials. Craft progress will be lost." onClick={cancel}>CANCEL</Button>
    </div>
  </div>
}
