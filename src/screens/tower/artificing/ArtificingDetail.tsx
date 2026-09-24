import { Hammer, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, Status } from '../../../components/ui'
import { EquipmentMetadata, ItemIcon, ItemTooltip } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import { ARTIFICING_RECIPES, type ArtificingRecipeDefinition } from '../../../game/content/recipes/artificingRecipes'
import { getRecipeUnlockRequirement, isRecipeUnlocked } from '../../../game/content/recipes/recipeUnlocks'
import { getConsumableQuantity } from '../../../game/core/inventory/inventoryConsumption'
import { getArtificingCraftCapacity, getArtificingLimitingIngredient, getArtificingMissingIngredients, getArtificingProfile, getArtifactArtificingState, canCraftArtificingRecipe } from '../../../game/systems/artificing/artificingSelectors'
import { useGameStore } from '../../../store/gameStore'
import { setNavigationIntent } from '../../../ui/navigation/navigationIntent'
import { ArtificingRecipePinButton } from '../../../components/recipe-pins/ArtificingRecipePinButton'
import { ActiveArtificingCraft } from './ActiveArtificingCraft'
import { EquipmentInspection } from './EquipmentInspection'
import { ArtifactPathModal } from '../../../components/artifacts/ArtifactPathModal'
import { isArtifactId } from '../../../game/content/artifacts/artifacts'

export function ArtificingDetail({ recipe }: { recipe: ArtificingRecipeDefinition | null }) {
  const state = useGameStore()
  const [sources, setSources] = useState<import('../../../game/types').ItemId | null>(null)
  if (!recipe) return <Card className="artificing-detail" title="ARCANE FORGE"><ActiveArtificingCraft /><div className="artificing-empty"><Hammer size={28} /><strong>SELECT EQUIPMENT</strong><p>Choose a blueprint from the catalog to inspect its requirements.</p></div></Card>
  const item = ITEMS[recipe.output.itemId]
  if (isArtifactId(item.id)) return <ArtifactArtificingDetail recipe={recipe} artifactId={item.id} />
  const unlocked = isRecipeUnlocked(state, recipe)
  const craftable = canCraftArtificingRecipe(state, recipe.id)
  const active = Boolean(state.activities.artificing.activeJob)
  const missing = getArtificingMissingIngredients(state, recipe.id).filter((entry) => entry.missing > 0)
  const reason = active ? 'Another Artificing job is already in progress.' : !unlocked ? getRecipeUnlockRequirement(recipe) : !craftable ? 'Not enough legal materials.' : undefined
  const capacity = getArtificingCraftCapacity(state, recipe.id)
  const limiting = getArtificingLimitingIngredient(state, recipe.id)
  return <Card className="artificing-detail" title="ARCANE FORGE"><div className="artificing-detail-content"><ItemTooltip itemId={item.id} owned={state.inventory[item.id] ?? 0}><div className="artificing-detail-hero" tabIndex={0}><ItemIcon itemId={item.id} size="large" /><div><span className="eyebrow">{getArtificingProfile(recipe)}</span><h2>{item.name}</h2><EquipmentMetadata item={item} /><span className="artificing-owned">OWNED {(state.inventory[item.id] ?? 0).toLocaleString()}</span></div></div></ItemTooltip><p className="artificing-description">{item.description}</p><ActiveArtificingCraft /><EquipmentInspection recipe={recipe} />{!unlocked && <div className="artificing-locked-banner"><LockKeyhole size={15} /><span>{getRecipeUnlockRequirement(recipe)}</span></div>}<section className="artificing-section"><span className="eyebrow">REQUIRED MATERIALS</span><div className="artificing-material-list">{recipe.ingredients.map((ingredient) => <MaterialRow key={ingredient.itemId} itemId={ingredient.itemId} required={ingredient.quantity} onWhereToGet={() => setSources(ingredient.itemId)} />)}</div>{sources && <small>{ITEMS[sources].name} · use the Collection or Transmutation source browser to locate this material.</small>}</section>{unlocked && <section className="artificing-section artificing-capacity"><span className="eyebrow">CRAFT CAPACITY</span><div className="artificing-capacity-grid"><span><small>CAN CRAFT</small><strong>{capacity}</strong></span><span><small>LIMITING MATERIAL</small><strong>{limiting?.name ?? '—'}</strong></span></div></section>}<div className="artificing-craft-actions"><Button variant="success" disabled={!craftable || active} tooltip={reason ?? undefined} onClick={() => state.craftArtificingRecipe(recipe.id)}>CRAFT</Button><ArtificingRecipePinButton recipeId={recipe.id} /><Status>{unlocked ? `ONE ITEM PER CRAFT · ${recipe.baseDurationMs / 1000}s` : 'LOCKED'}</Status></div>{missing.length > 0 && <div className="artificing-missing-summary"><strong>MISSING MATERIALS</strong>{missing.map((entry) => <span key={entry.itemId}>Need {entry.missing} more {ITEMS[entry.itemId].name}</span>)}</div>}</div></Card>
}

function ArtifactArtificingDetail({ recipe, artifactId }: { recipe: ArtificingRecipeDefinition; artifactId: import('../../../game/types').ArtifactId }) {
  const state = useGameStore()
  const [pathOpen, setPathOpen] = useState(false)
  const item = ITEMS[artifactId]
  const artifactState = getArtifactArtificingState(state, artifactId)
  if (!artifactState) return null
  const unlocked = isRecipeUnlocked(state, recipe)
  const active = Boolean(state.activities.artificing.activeJob)
  const modeLabel = artifactState.mode === 'forge' ? 'NOT OWNED' : `RANKS ${artifactState.investedRanks} / ${artifactState.maxRanks}`
  return <><Card className="artificing-detail" title="ARCANE FORGE"><div className="artificing-detail-content"><ItemTooltip itemId={artifactId} owned={state.inventory[artifactId] ?? 0}><div className="artificing-detail-hero" tabIndex={0}><ItemIcon itemId={artifactId} size="large" /><div><span className="eyebrow">T{artifactState.tier} ARTIFACT</span><h2>{item.name}</h2><EquipmentMetadata item={item} /><span className="artificing-owned">{artifactState.owned ? 'OWNED' : 'NOT OWNED'}</span></div></div></ItemTooltip><p className="artificing-description">{item.description}</p><ActiveArtificingCraft /><section className="artificing-section"><span className="eyebrow">PROGRESSION</span><strong>{modeLabel}</strong>{artifactState.mode === 'owned' ? <span>Purchase Minor ranks in the Artifact Path. Major milestones unlock automatically.</span> : <span>Forge this unique Artifact once. It cannot be crafted again after acquisition.</span>}{artifactState.ingredients.length > 0 && <div className="artificing-material-list">{artifactState.ingredients.map((ingredient) => <MaterialRow key={ingredient.itemId} itemId={ingredient.itemId} required={ingredient.quantity} onWhereToGet={() => undefined} />)}</div>}<div className="button-row">{artifactState.owned && <Button variant="secondary" onClick={() => setPathOpen(true)}>OPEN ARTIFACT PATH</Button>}{artifactState.mode === 'forge' && <Button variant="success" disabled={!unlocked || !artifactState.canStart || active} tooltip={artifactState.reason ?? (!unlocked ? getRecipeUnlockRequirement(recipe) ?? undefined : undefined)} onClick={() => state.craftArtificingRecipe(recipe.id)}>FORGE ARTIFACT</Button>}{artifactState.mode === 'forge' && <ArtificingRecipePinButton recipeId={recipe.id} />}</div></section><EquipmentInspection recipe={recipe} /></div></Card>{pathOpen && artifactState.owned && <ArtifactPathModal artifactId={artifactId} onClose={() => setPathOpen(false)} />}</>
}

function MaterialRow({ itemId, required, onWhereToGet }: { itemId: import('../../../game/types').ItemId; required: number; onWhereToGet: () => void }) {
  const state = useGameStore()
  const available = getConsumableQuantity(state, itemId)
  const missing = available < required
  return <div className={`artificing-material-row ${missing ? 'missing' : ''}`}><ItemTooltip itemId={itemId} owned={state.inventory[itemId] ?? 0}><span><ItemIcon itemId={itemId} size="tiny" />{ITEMS[itemId].name}</span></ItemTooltip><strong>{available.toLocaleString()} / {required}</strong>{missing && <button type="button" className="artificing-source-button" onClick={onWhereToGet}>WHERE TO GET?</button>}<span aria-label={missing ? 'Missing materials' : 'Enough available'}>{missing ? '×' : '✓'}</span></div>
}
