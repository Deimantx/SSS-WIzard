import { Hammer, LockKeyhole } from 'lucide-react'
import { Button, Card, Status } from '../../../components/ui'
import { ItemIcon, ItemTooltip } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import { DUNGEONS } from '../../../game/content/dungeons/dungeons'
import type { ArtificingRecipeDefinition } from '../../../game/content/recipes/artificingRecipes'
import { isRecipeUnlocked, getRecipeUnlockRequirement } from '../../../game/content/recipes/recipeUnlocks'
import { getConsumableQuantity } from '../../../game/core/inventory/inventoryConsumption'
import { getArtificingProfile, canCraftArtificingRecipe } from '../../../game/systems/artificing/artificingSelectors'
import { useGameStore } from '../../../store/gameStore'

export function ArtificingDetail({ recipe }: { recipe: ArtificingRecipeDefinition | null }) {
  const state = useGameStore()
  if (!recipe) return <Card className="artificing-detail" title="ARCANE FORGE"><div className="artificing-empty"><Hammer size={28} /><strong>SELECT EQUIPMENT</strong><p>Choose a blueprint from the catalog to inspect its requirements.</p></div></Card>
  const item = ITEMS[recipe.output.itemId]
  const unlocked = isRecipeUnlocked(state, recipe)
  const craftable = canCraftArtificingRecipe(state, recipe.id)
  const reason = !unlocked ? getRecipeUnlockRequirement(recipe) : !craftable ? 'Not enough available materials. Protected, equipped, and Research-reserved copies cannot be consumed.' : 'Consume the listed materials and create exactly one item immediately.'
  return <Card className="artificing-detail" title="ARCANE FORGE">
    <div className="artificing-detail-content">
      <ItemTooltip itemId={item.id} owned={state.inventory[item.id] ?? 0}><div className="artificing-detail-hero" tabIndex={0}><ItemIcon itemId={item.id} size="large" /><div><span className="eyebrow">{getArtificingProfile(recipe)}</span><h2>{item.name}</h2><span className="artificing-owned">OWNED {(state.inventory[item.id] ?? 0).toLocaleString()}</span></div></div></ItemTooltip>
      <p className="artificing-description">{item.description}</p><span className="artificing-source">{DUNGEONS[recipe.sourceDungeonId].name}</span>
      {!unlocked && <div className="artificing-locked-banner"><LockKeyhole size={15} /><span>{getRecipeUnlockRequirement(recipe)}</span></div>}
      <section className="artificing-section"><span className="eyebrow">REQUIRED MATERIALS</span><div className="artificing-material-list">{recipe.ingredients.map(ingredient => {
        const available = getConsumableQuantity(state, ingredient.itemId)
        const material = ITEMS[ingredient.itemId]
        return <ItemTooltip key={material.id} itemId={material.id} owned={state.inventory[material.id] ?? 0} protectedItem={state.protectedItems[material.id]}><div tabIndex={0} className={`artificing-material-row ${available < ingredient.quantity ? 'missing' : ''}`}><ItemIcon itemId={material.id} size="tiny" /><span>{material.name}</span><strong>{available.toLocaleString()} / {ingredient.quantity}</strong><span aria-label={available >= ingredient.quantity ? 'Enough available' : 'Missing materials'}>{available >= ingredient.quantity ? '✓' : '✕'}</span></div></ItemTooltip>
      })}</div></section>
      <div className="artificing-craft-actions"><Button className="artificing-craft-button" variant="success" disabled={!craftable} tooltip={reason ?? undefined} onClick={() => state.craftArtificingRecipe(recipe.id)}>CRAFT</Button><Status>{unlocked ? 'ONE ITEM PER CRAFT' : 'LOCKED'}</Status></div>
    </div>
  </Card>
}
