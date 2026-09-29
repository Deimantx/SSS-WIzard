import { useState } from 'react'
import { ArchiveItemTile, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon, ItemQuantity, ItemUsesDialog } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import { getItemUses } from '../../game/content/items/inventoryMetadata'
import { isTransmutationRecipeId } from '../../game/content/recipes/recipes'
import type { ItemId } from '../../game/types'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { buildItemContextSections } from '../../ui/context-menu/itemContextActions'
import { useGameStore } from '../../store/gameStore'
import { getItemDropSources, getItemSources } from '../../game/content/contentRelations'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'

export function CollectionItemCard({ itemId, discovered, quantity, selected, newItem = false, onSelect }: { itemId: ItemId; discovered: boolean; quantity: number; selected: boolean; newItem?: boolean; onSelect: () => void }) {
  const item = ITEMS[itemId]
  const { openContextMenu } = useGameContextMenu()
  const setScreen = useGameStore((state) => state.setScreen)
  const preferences = useUiPreferences()
  const firstDrop = getItemDropSources(itemId)[0]
  const output = getItemSources(itemId).find((relation) => relation.kind === 'recipe' && relation.detail.endsWith('output'))
  const uses = getItemUses(itemId)
  const [usesOpen, setUsesOpen] = useState(false)
  const card = <ArchiveItemTile
    className={`collection-item-card ${discovered ? 'discovered' : ''}`}
    art={discovered ? <ItemIcon itemId={itemId} size="tile" /> : <span className="collection-unknown-mark">?</span>}
    title={discovered ? item.name : 'Undiscovered'}
    secondary={discovered ? <>Owned <ItemQuantity value={quantity} compact /></> : 'Undiscovered'}
    ariaLabel={discovered ? `${item.name}, owned ${quantity}${selected ? ', selected' : ''}` : 'Undiscovered item'}
    selected={selected}
    hidden={!discovered}
    mark={discovered ? newItem ? 'new' : 'registered' : undefined}
    onSelect={onSelect}
    onContextMenu={(event) => { if (!discovered) return; event.preventDefault(); event.stopPropagation(); openContextMenu({ x: event.clientX, y: event.clientY, anchor: event.currentTarget, header: { title: item.name, meta: `${item.inventoryCategory.toUpperCase()} · OWNED ${quantity}` }, sections: buildItemContextSections({ itemId, owned: quantity, source: 'collection', tracked: preferences.trackedItemId === itemId, onResearch: item.researchSchool ? () => { setNavigationIntent({ researchItemId: itemId, researchSchoolId: null }); setScreen('tower-research') } : undefined, onOpenUses: uses.length > 0 ? () => setUsesOpen(true) : undefined, onOpenArtificing: output?.detail === 'Artificing output' ? () => { setUiPreferences({ screenState: { artificing: { selectedRecipeId: output.id as never } } }); setScreen('tower-artificing') } : undefined, onOpenTransmutation: output?.detail === 'Transmutation output' ? () => { setUiPreferences({ screenState: { transmutation: { selectedRecipeId: output.id as never } } }); setScreen('tower-transmutation') } : undefined, onWhereToGet: firstDrop ? () => { setNavigationIntent({ combatDungeonId: firstDrop.dungeonId, combatMonsterId: firstDrop.monsterId }); setScreen('combat') } : undefined, onOpenInventory: () => { setNavigationIntent({ inventoryItemId: itemId }); setScreen('inventory') }, onOpenCollection: () => onSelect(), onTrack: () => setUiPreferences({ trackedItemId: preferences.trackedItemId === itemId ? null : itemId }) }) }) }}
  />
  return <><GameTooltip block content={<TooltipContent title={discovered ? item.name : 'Undiscovered Item'} description={discovered ? `${item.inventoryCategory} · Owned ${quantity.toLocaleString()}` : 'Acquire it once to reveal this archive entry.'} />}>{card}</GameTooltip><ItemUsesDialog itemId={itemId} uses={uses} open={usesOpen} onClose={() => setUsesOpen(false)} onSelectRecipe={(recipeId) => { setUsesOpen(false); if (isTransmutationRecipeId(recipeId)) { setNavigationIntent({ transmutationRecipeId: recipeId }); setScreen('tower-transmutation') } else { setNavigationIntent({ artificingRecipeId: recipeId as never }); setScreen('tower-artificing') } }} /></>
}
