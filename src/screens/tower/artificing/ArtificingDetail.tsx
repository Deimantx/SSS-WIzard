import { Hammer, LockKeyhole } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, Status } from '../../../components/ui'
import { EquipmentMetadata, ItemIcon, ItemTooltip, ItemUsesDialog } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import { ARTIFICING_RECIPES, type ArtificingRecipeDefinition } from '../../../game/content/recipes/artificingRecipes'
import { isRecipeUnlocked, getRecipeUnlockRequirement } from '../../../game/content/recipes/recipeUnlocks'
import { getConsumableQuantity } from '../../../game/core/inventory/inventoryConsumption'
import { getArtificingProfile, canCraftArtificingRecipe, getArtificingCraftCapacity, getArtificingLimitingIngredient, getArtificingMissingIngredients } from '../../../game/systems/artificing/artificingSelectors'
import { useGameStore } from '../../../store/gameStore'
import { useGameContextMenu } from '../../../ui/context-menu/GameContextMenuProvider'
import { buildItemContextSections } from '../../../ui/context-menu/itemContextActions'
import { getItemDropSources, getItemSources } from '../../../game/content/contentRelations'
import { getItemUses } from '../../../game/content/items/inventoryMetadata'
import { isTransmutationRecipeId } from '../../../game/content/recipes/recipes'
import { setNavigationIntent } from '../../../ui/navigation/navigationIntent'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { ActiveArtificingCraft } from './ActiveArtificingCraft'
import { EquipmentInspection } from './EquipmentInspection'
import { ARTIFACTS } from '../../../game/content/artifacts/artifacts'
import { getArtifactLevel, getArtifactLevelCap, getArtifactUpgrade } from '../../../game/systems/artifacts/artifactProgression'
import { ArtifactPathModal } from '../../../components/artifacts/ArtifactPathModal'

export function ArtificingDetail({ recipe }: { recipe: ArtificingRecipeDefinition | null }) {
  const state = useGameStore()
  const uiPreferences = useUiPreferences().screenState.artificing
  const [sources, setSources] = useState<import('../../../game/types').ItemId | null>(null)
  const [crafted, setCrafted] = useState<string | null>(null)
  const [pathOpen, setPathOpen] = useState(false)
  const activeId = state.activities.artificing.activeJob
  const activeRecipe = activeId?.kind === 'recipe' ? ARTIFICING_RECIPES[activeId.recipeId] : null
  useEffect(() => { if (sources && recipe && !recipe.ingredients.some(i => i.itemId === sources && getConsumableQuantity(state, i.itemId) < i.quantity)) setSources(null) }, [sources, recipe, state.inventory, state.protectedItems])
  useEffect(() => { if (recipe && state.recentAcquisitions?.[0]?.itemId === recipe.output.itemId) setCrafted(ITEMS[recipe.output.itemId].name) }, [state.recentAcquisitions?.[0]?.timestamp, recipe?.output.itemId])
  if (!recipe) return <Card className="artificing-detail" title="ARCANE FORGE"><ActiveArtificingCraft /><div className="artificing-empty"><Hammer size={28} /><strong>SELECT EQUIPMENT</strong><p>Choose a blueprint from the catalog to inspect its requirements.</p></div></Card>
  const item = ITEMS[recipe.output.itemId]
  const artifact = ARTIFACTS[item.id]
  const artifactOwned = Boolean(artifact && (state.inventory[item.id] ?? 0) > 0 && state.artifactProgress[item.id])
  const artifactLevel = artifact ? getArtifactLevel(state, item.id) : 0
  const artifactCap = artifact ? getArtifactLevelCap(state, item.id) : 0
  const nextUpgrade = artifact ? getArtifactUpgrade(item.id, artifactLevel) : null
  const unlocked = isRecipeUnlocked(state, recipe)
  const craftable = canCraftArtificingRecipe(state, recipe.id)
  const capacity = getArtificingCraftCapacity(state, recipe.id)
  const limiting = getArtificingLimitingIngredient(state, recipe.id)
  const missing = getArtificingMissingIngredients(state, recipe.id).filter(entry => entry.missing > 0)
  const reason = activeId ? 'Another Artificing job is already in progress.' : !unlocked ? getRecipeUnlockRequirement(recipe) : !craftable ? 'Not enough legal materials. Protected, equipped, and reserved copies cannot be consumed.' : undefined
  const sourceDrops = sources ? getItemDropSources(sources) : []
  const sourceTransmutation = sources ? getItemSources(sources).find((relation) => relation.kind === 'recipe' && relation.detail === 'Transmutation output') : undefined
  const openSourceTransmutation = () => { if (!sourceTransmutation) return; setNavigationIntent({ transmutationRecipeId: sourceTransmutation.id as never }); state.setScreen('tower-transmutation') }
  const openSourceCombat = () => { const drop = sourceDrops[0]; if (!drop) return; setNavigationIntent({ combatDungeonId: drop.dungeonId, combatMonsterId: drop.monsterId }); state.setScreen('combat') }
  const openCraftedInventory = () => { setNavigationIntent({ inventoryItemId: item.id }); state.setScreen('inventory') }
  return <><Card className="artificing-detail" title="ARCANE FORGE">
    <div className="artificing-detail-content">
      <ItemTooltip itemId={item.id} owned={state.inventory[item.id] ?? 0}><div className="artificing-detail-hero" tabIndex={0}><ItemIcon itemId={item.id} size="large" /><div><span className="eyebrow">{getArtificingProfile(recipe)}</span><h2>{item.name}</h2><EquipmentMetadata item={item} /><span className="artificing-owned">OWNED {(state.inventory[item.id] ?? 0).toLocaleString()}</span></div></div></ItemTooltip>
      <p className="artificing-description">{item.description}</p><ActiveArtificingCraft />{artifact && artifactOwned && <section className="artificing-section"><span className="eyebrow">TIER {artifact.tier} ARTIFACT</span><strong>LEVEL {artifactLevel} / {artifact.maxLevel}</strong><span>{artifactLevel >= artifactCap ? `CURRENT TUTORIAL CAP: ${artifactCap}` : nextUpgrade ? `NEXT UPGRADE · LEVEL ${artifactLevel} → ${artifactLevel + 1}` : 'MAX ARTIFACT LEVEL'}</span><div className="button-row"><Button variant="secondary" onClick={() => setPathOpen(true)}>ARTIFACT PATH</Button>{nextUpgrade && artifactLevel < artifactCap && <Button variant="success" disabled={Boolean(activeId)} onClick={() => state.upgradeArtifact(item.id)}>UPGRADE ARTIFACT</Button>}</div>{nextUpgrade && artifactLevel < artifactCap && <div className="artificing-material-list">{nextUpgrade.ingredients.map(ingredient => <ArtificingMaterialRow key={ingredient.itemId} itemId={ingredient.itemId} available={getConsumableQuantity(state, ingredient.itemId)} required={ingredient.quantity} missing={getConsumableQuantity(state, ingredient.itemId) < ingredient.quantity} onWhereToGet={() => setSources(ingredient.itemId)} />)}</div>}</section>}<EquipmentInspection recipe={recipe} />
      {!unlocked && <div className="artificing-locked-banner"><LockKeyhole size={15} /><span>{getRecipeUnlockRequirement(recipe)}</span></div>}
      <section className="artificing-section"><span className="eyebrow">REQUIRED MATERIALS</span><div className="artificing-material-list">{recipe.ingredients.map(ingredient => {
        const available = getConsumableQuantity(state, ingredient.itemId)
        const material = ITEMS[ingredient.itemId]
        return <ArtificingMaterialRow key={material.id} itemId={material.id} available={available} required={ingredient.quantity} missing={available < ingredient.quantity} onWhereToGet={() => setSources(sources === material.id ? null : material.id)} />
      })}</div></section>
      {sources && <div className="artificing-material-sources"><strong>{ITEMS[sources].name}</strong>{sourceDrops.map(drop => <span key={drop.monsterId}>{drop.monsterName} · {drop.dungeonName} · {(drop.chance * 100).toFixed(1)}% · {drop.min}–{drop.max}</span>)}{sourceTransmutation && <button type="button" onClick={openSourceTransmutation}>OPEN TRANSMUTATION</button>}{sourceDrops.length > 0 && <button type="button" onClick={openSourceCombat}>OPEN COMBAT</button>}</div>}
      {unlocked && missing.length > 0 && <div className="artificing-missing-summary"><strong>MISSING MATERIALS</strong>{missing.map(entry => <span key={entry.itemId}>Need {entry.missing} more {ITEMS[entry.itemId].name}</span>)}</div>}
      {unlocked && <section className="artificing-section artificing-capacity"><span className="eyebrow">CRAFT CAPACITY</span><div className="artificing-capacity-grid"><span><small>CAN CRAFT</small><strong>{capacity}</strong></span><span><small>LIMITING MATERIAL</small><strong>{limiting?.name ?? '—'}</strong></span></div></section>}
      <button type="button" className="artificing-pin-button" onClick={() => setUiPreferences({ screenState: { artificing: { pinnedRecipeId: uiPreferences.pinnedRecipeId === recipe.id ? null : recipe.id } } })}>{uiPreferences.pinnedRecipeId === recipe.id ? 'UNPIN RECIPE' : 'PIN RECIPE'}</button><div className={`artificing-craft-actions ${crafted ? 'craft-success' : ''}`}><Button className="artificing-craft-button" variant="success" disabled={!craftable || Boolean(activeId)} tooltip={reason ?? undefined} onClick={() => state.craftArtificingRecipe(recipe.id)}>CRAFT</Button><Status>{unlocked ? 'ONE ITEM PER CRAFT · {recipe.baseDurationMs / 1000}s' : 'LOCKED'}</Status></div>{crafted && <div className="artificing-crafted-result"><strong>CRAFTED · {crafted}</strong><div><Button variant="secondary" onClick={() => state.equipItem(item.id)}>EQUIP</Button><Button variant="ghost" onClick={openCraftedInventory}>VIEW INVENTORY</Button></div></div>}
    </div>
  </Card>{pathOpen && artifact && <ArtifactPathModal artifactId={item.id} onClose={() => setPathOpen(false)} />}</>
}

function ArtificingMaterialRow({ itemId, available, required, missing, onWhereToGet }: { itemId: import('../../../game/types').ItemId; available: number; required: number; missing: boolean; onWhereToGet: () => void }) {
  const state = useGameStore()
  const preferences = useUiPreferences()
  const { openContextMenu } = useGameContextMenu()
  const item = ITEMS[itemId]
  const drop = getItemDropSources(itemId)[0]
  const output = getItemSources(itemId).find((relation) => relation.kind === 'recipe' && relation.detail.endsWith('output'))
  const uses = getItemUses(itemId)
  const [usesOpen, setUsesOpen] = useState(false)
  const openMenu = (x: number, y: number, anchor?: HTMLElement) => openContextMenu({ x, y, anchor, header: { title: item.name, meta: `ARTIFICING REQUIREMENT · ${available} / ${required}` }, sections: buildItemContextSections({ itemId, owned: state.inventory[itemId] ?? 0, protectedItem: Boolean(state.protectedItems[itemId]), source: 'reference', onOpenInventory: () => { setNavigationIntent({ inventoryItemId: itemId }); state.setScreen('inventory') }, onWhereToGet: drop ? () => { setNavigationIntent({ combatDungeonId: drop.dungeonId, combatMonsterId: drop.monsterId }); state.setScreen('combat') } : onWhereToGet, onOpenUses: uses.length > 0 ? () => setUsesOpen(true) : undefined, onOpenArtificing: output?.detail === 'Artificing output' ? () => { setUiPreferences({ screenState: { artificing: { selectedRecipeId: output.id as never } } }); state.setScreen('tower-artificing') } : undefined, onOpenTransmutation: output?.detail === 'Transmutation output' ? () => { setUiPreferences({ screenState: { transmutation: { selectedRecipeId: output.id as never } } }); state.setScreen('tower-transmutation') } : undefined, onTrack: () => setUiPreferences({ trackedItemId: preferences.trackedItemId === itemId ? null : itemId }) }) })
  return <><ItemTooltip itemId={itemId} owned={state.inventory[itemId] ?? 0} protectedItem={state.protectedItems[itemId]}><div tabIndex={0} className={`artificing-material-row ${missing ? 'missing' : ''}`} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openMenu(event.clientX, event.clientY, event.currentTarget) }} onKeyDown={(event) => { if (event.shiftKey && event.key === 'F10') { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); openMenu(rect.left, rect.bottom, event.currentTarget) } }}><ItemIcon itemId={itemId} size="tiny" /><span>{item.name}</span><strong>{available.toLocaleString()} / {required}</strong>{missing && <button type="button" className="artificing-source-button" onClick={onWhereToGet}>WHERE TO GET?</button>}<span aria-label={missing ? 'Missing materials' : 'Enough available'}>{missing ? '✕' : '✓'}</span></div></ItemTooltip><ItemUsesDialog itemId={itemId} uses={uses} open={usesOpen} onClose={() => setUsesOpen(false)} onSelectRecipe={(recipeId) => { setUsesOpen(false); if (isTransmutationRecipeId(recipeId)) { setNavigationIntent({ transmutationRecipeId: recipeId }); state.setScreen('tower-transmutation') } else { setNavigationIntent({ artificingRecipeId: recipeId as never }); state.setScreen('tower-artificing') } }} /></>
}
