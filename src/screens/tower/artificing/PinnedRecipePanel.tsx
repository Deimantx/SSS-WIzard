import { Card } from '../../../components/ui'
import { ItemIcon, ItemTooltip } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import type { ArtificingRecipeDefinition } from '../../../game/content/recipes/artificingRecipes'
import { getArtificingCraftCapacity, getArtificingMissingIngredients } from '../../../game/systems/artificing/artificingSelectors'
import { setUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../../store/gameStore'

export function PinnedRecipePanel({ recipe, onSelect }: { recipe: ArtificingRecipeDefinition; onSelect: (id: ArtificingRecipeDefinition['id']) => void }) {
  const state = useGameStore()
  const entries = getArtificingMissingIngredients(state, recipe.id)
  const missing = entries.filter(entry => entry.missing > 0)
  return <Card className="artificing-pinned-recipe" title="PINNED RECIPE"><div className="artificing-pinned-content"><ItemTooltip itemId={recipe.output.itemId} owned={state.inventory[recipe.output.itemId] ?? 0}><div className="artificing-detail-hero"><ItemIcon itemId={recipe.output.itemId} size="tiny" /><strong>{recipe.name}</strong></div></ItemTooltip>{entries.map(entry => <div className="artificing-pinned-material" key={entry.itemId}><span>{ITEMS[entry.itemId].name}</span><strong>{entry.available} / {entry.required} {entry.missing > 0 ? '· NEED ' + entry.missing : '· ✓'}</strong></div>)}<strong>{missing.length ? 'MISSING MATERIALS' : 'READY · CAPACITY ' + getArtificingCraftCapacity(state, recipe.id)}</strong><div className="button-row"><button type="button" onClick={() => onSelect(recipe.id)}>SELECT RECIPE</button><button type="button" onClick={() => setUiPreferences({ screenState: { artificing: { pinnedRecipeId: null } } })}>UNPIN</button></div></div></Card>
}
