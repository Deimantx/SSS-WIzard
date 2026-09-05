import { Button, Card, Status } from '../../../components/ui'
import { ItemIcon, ItemTooltip } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import type { ArtificingRecipeDefinition } from '../../../game/content/recipes/artificingRecipes'
import { getArtificingCraftCapacity, getArtificingMissingIngredients, getArtificingProfile } from '../../../game/systems/artificing/artificingSelectors'
import { setUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../../store/gameStore'

export function PinnedRecipePanel({ recipe, onSelect }: { recipe: ArtificingRecipeDefinition; onSelect: (id: ArtificingRecipeDefinition['id']) => void }) {
  const state = useGameStore()
  const entries = getArtificingMissingIngredients(state, recipe.id)
  const missing = entries.filter(entry => entry.missing > 0)
  return <Card className="artificing-pinned-recipe" title="PINNED RECIPE">
    <div className="artificing-pinned-content">
      <ItemTooltip itemId={recipe.output.itemId} owned={state.inventory[recipe.output.itemId] ?? 0}>
        <div className="artificing-pinned-identity" tabIndex={0}>
          <ItemIcon itemId={recipe.output.itemId} size="tile" />
          <div><span className="eyebrow">{getArtificingProfile(recipe)}</span><strong>{recipe.name}</strong></div>
        </div>
      </ItemTooltip>
      <section className="artificing-section"><span className="eyebrow">REQUIRED MATERIALS</span>
        <div className="artificing-pinned-materials">{entries.map(entry => <div className={'artificing-pinned-material' + (entry.ready ? '' : ' missing')} key={entry.itemId}>
          <ItemTooltip itemId={entry.itemId} owned={state.inventory[entry.itemId] ?? 0} protectedItem={state.protectedItems[entry.itemId]}>
            <span className="artificing-pinned-material-name" tabIndex={0}><ItemIcon itemId={entry.itemId} size="tiny" /><span>{ITEMS[entry.itemId].name}</span></span>
          </ItemTooltip>
          <strong>{entry.available.toLocaleString()} / {entry.required.toLocaleString()}</strong>
          {!entry.ready && <small>Need {entry.missing.toLocaleString()} more</small>}
        </div>)}</div>
      </section>
      <div className="artificing-pinned-summary"><Status tone={missing.length ? 'warning' : 'success'}>{missing.length ? 'MISSING MATERIALS' : 'READY'}</Status><span>CAN CRAFT <strong>{getArtificingCraftCapacity(state, recipe.id)}</strong></span></div>
      <div className="artificing-craft-actions">
        <Button variant="secondary" tooltip="Inspect this pinned recipe in Arcane Forge." onClick={() => onSelect(recipe.id)}>SELECT RECIPE</Button>
        <Button variant="ghost" tooltip="Stop tracking this recipe." onClick={() => setUiPreferences({ screenState: { artificing: { pinnedRecipeId: null } } })}>UNPIN</Button>
      </div>
    </div>
  </Card>
}
