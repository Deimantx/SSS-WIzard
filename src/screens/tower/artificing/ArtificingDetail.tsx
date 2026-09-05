import { Hammer, LockKeyhole } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, Status } from '../../../components/ui'
import { ItemIcon, ItemTooltip } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import { ARTIFICING_RECIPES, type ArtificingRecipeDefinition } from '../../../game/content/recipes/artificingRecipes'
import { isRecipeUnlocked, getRecipeUnlockRequirement } from '../../../game/content/recipes/recipeUnlocks'
import { getConsumableQuantity } from '../../../game/core/inventory/inventoryConsumption'
import { getArtificingProfile, canCraftArtificingRecipe, getArtificingCraftCapacity, getArtificingLimitingIngredient, getArtificingMissingIngredients } from '../../../game/systems/artificing/artificingSelectors'
import { useGameStore } from '../../../store/gameStore'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { getItemDropSources, getItemSources } from '../../../game/content/contentRelations'
import { ActiveArtificingCraft } from './ActiveArtificingCraft'
import { EquipmentInspection } from './EquipmentInspection'

export function ArtificingDetail({ recipe }: { recipe: ArtificingRecipeDefinition | null }) {
  const state = useGameStore()
  const uiPreferences = useUiPreferences().screenState.artificing
  const [sources, setSources] = useState<import('../../../game/types').ItemId | null>(null)
  const [crafted, setCrafted] = useState<string | null>(null)
  const activeId = state.activities.artificing.activeRecipeId
  const activeRecipe = activeId ? ARTIFICING_RECIPES[activeId] : null
  useEffect(() => { if (sources && recipe && !recipe.ingredients.some(i => i.itemId === sources && getConsumableQuantity(state, i.itemId) < i.quantity)) setSources(null) }, [sources, recipe, state.inventory, state.protectedItems])
  useEffect(() => { if (recipe && state.recentAcquisitions?.[0]?.itemId === recipe.output.itemId) setCrafted(ITEMS[recipe.output.itemId].name) }, [state.recentAcquisitions?.[0]?.timestamp, recipe?.output.itemId])
  if (!recipe) return <Card className="artificing-detail" title="ARCANE FORGE"><ActiveArtificingCraft /><div className="artificing-empty"><Hammer size={28} /><strong>SELECT EQUIPMENT</strong><p>Choose a blueprint from the catalog to inspect its requirements.</p></div></Card>
  const item = ITEMS[recipe.output.itemId]
  const unlocked = isRecipeUnlocked(state, recipe)
  const craftable = canCraftArtificingRecipe(state, recipe.id)
  const capacity = getArtificingCraftCapacity(state, recipe.id)
  const limiting = getArtificingLimitingIngredient(state, recipe.id)
  const missing = getArtificingMissingIngredients(state, recipe.id).filter(entry => entry.missing > 0)
  const reason = activeRecipe ? `${ITEMS[activeRecipe.output.itemId].name} is currently being crafted.` : !unlocked ? getRecipeUnlockRequirement(recipe) : !craftable ? 'Not enough legal materials. Protected, equipped, and reserved copies cannot be consumed.' : undefined
  return <Card className="artificing-detail" title="ARCANE FORGE">
    <div className="artificing-detail-content">
      <ItemTooltip itemId={item.id} owned={state.inventory[item.id] ?? 0}><div className="artificing-detail-hero" tabIndex={0}><ItemIcon itemId={item.id} size="large" /><div><span className="eyebrow">{getArtificingProfile(recipe)}</span><h2>{item.name}</h2><span className="artificing-owned">OWNED {(state.inventory[item.id] ?? 0).toLocaleString()}</span></div></div></ItemTooltip>
      <p className="artificing-description">{item.description}</p><ActiveArtificingCraft /><EquipmentInspection recipe={recipe} />
      {!unlocked && <div className="artificing-locked-banner"><LockKeyhole size={15} /><span>{getRecipeUnlockRequirement(recipe)}</span></div>}
      <section className="artificing-section"><span className="eyebrow">REQUIRED MATERIALS</span><div className="artificing-material-list">{recipe.ingredients.map(ingredient => {
        const available = getConsumableQuantity(state, ingredient.itemId)
        const material = ITEMS[ingredient.itemId]
        const dropSources = getItemDropSources(material.id)
        const hasTransmutationSource = getItemSources(material.id).some(relation => relation.kind === 'recipe' && relation.detail === 'Transmutation output')
        return <ItemTooltip key={material.id} itemId={material.id} owned={state.inventory[material.id] ?? 0} protectedItem={state.protectedItems[material.id]}><div tabIndex={0} className={`artificing-material-row ${available < ingredient.quantity ? 'missing' : ''}`}><ItemIcon itemId={material.id} size="tiny" /><span>{material.name}</span><strong>{available.toLocaleString()} / {ingredient.quantity}</strong>{available < ingredient.quantity && <button type="button" className="artificing-source-button" onClick={() => setSources(sources === material.id ? null : material.id)}>WHERE TO GET?</button>}<span aria-label={available >= ingredient.quantity ? 'Enough available' : 'Missing materials'}>{available >= ingredient.quantity ? '✓' : '✕'}</span></div></ItemTooltip>
      })}</div></section>
      {sources && <div className="artificing-material-sources"><strong>{ITEMS[sources].name}</strong>{getItemDropSources(sources as import('../../../game/types').ItemId).map(drop => <span key={drop.monsterId}>{drop.monsterName} · {drop.dungeonName} · {(drop.chance * 100).toFixed(1)}% · {drop.min}–{drop.max}</span>)}{getItemSources(sources as import('../../../game/types').ItemId).some(relation => relation.kind === 'recipe' && relation.detail === 'Transmutation output') && <button type="button" onClick={() => state.setScreen('tower-transmutation')}>OPEN TRANSMUTATION</button>}{getItemDropSources(sources as import('../../../game/types').ItemId).length > 0 && <button type="button" onClick={() => state.setScreen('combat')}>OPEN COMBAT</button>}</div>}
      {unlocked && missing.length > 0 && <div className="artificing-missing-summary"><strong>MISSING MATERIALS</strong>{missing.map(entry => <span key={entry.itemId}>Need {entry.missing} more {ITEMS[entry.itemId].name}</span>)}</div>}
      {unlocked && <section className="artificing-section artificing-capacity"><span className="eyebrow">CRAFT CAPACITY</span><div className="artificing-capacity-grid"><span><small>CAN CRAFT</small><strong>{capacity}</strong></span><span><small>LIMITING MATERIAL</small><strong>{limiting?.name ?? '—'}</strong></span></div></section>}
      <button type="button" className="artificing-pin-button" onClick={() => setUiPreferences({ screenState: { artificing: { pinnedRecipeId: uiPreferences.pinnedRecipeId === recipe.id ? null : recipe.id } } })}>{uiPreferences.pinnedRecipeId === recipe.id ? 'UNPIN RECIPE' : 'PIN RECIPE'}</button><div className={`artificing-craft-actions ${crafted ? 'craft-success' : ''}`}><Button className="artificing-craft-button" variant="success" disabled={!craftable || Boolean(activeId)} tooltip={reason ?? undefined} onClick={() => state.craftArtificingRecipe(recipe.id)}>CRAFT</Button><Status>{unlocked ? 'ONE ITEM PER CRAFT · {recipe.baseDurationMs / 1000}s' : 'LOCKED'}</Status></div>{crafted && <div className="artificing-crafted-result"><strong>CRAFTED · {crafted}</strong><div><Button variant="secondary" onClick={() => state.equipItem(item.id)}>EQUIP</Button><Button variant="ghost" onClick={() => state.setScreen('inventory')}>VIEW INVENTORY</Button></div></div>}
    </div>
  </Card>
}
