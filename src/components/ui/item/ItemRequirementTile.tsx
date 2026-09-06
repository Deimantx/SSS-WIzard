import { ITEMS } from '../../../game/content/items/items'
import type { ItemId } from '../../../game/types'
import { GameTooltip } from '../tooltip/Tooltip'
import { ItemIcon } from './ItemIcon'
import { ItemTooltipContent } from './ItemTooltip'
import { useState } from 'react'
import { useGameContextMenu } from '../../../ui/context-menu/GameContextMenuProvider'
import { buildItemContextSections } from '../../../ui/context-menu/itemContextActions'
import { getItemDropSources, getItemSources } from '../../../game/content/contentRelations'
import { getItemUses } from '../../../game/content/items/inventoryMetadata'
import { useGameStore } from '../../../store/gameStore'
import { ItemUsesDialog } from './ItemUsesDialog'
import { isTransmutationRecipeId } from '../../../game/content/recipes/recipes'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { setNavigationIntent } from '../../../ui/navigation/navigationIntent'

export function ItemRequirementTile({ itemId, owned, required, available = owned, equipped = 0, protectedItem }: { itemId: ItemId; owned: number; required: number; available?: number; equipped?: number; protectedItem: boolean }) {
  const item = ITEMS[itemId]
  const state = useGameStore()
  const preferences = useUiPreferences()
  const { openContextMenu } = useGameContextMenu()
  const missing = Math.max(0, required - available)
  const stateClass = protectedItem ? 'is-protected' : missing > 0 ? 'missing' : 'sufficient'
  const status = protectedItem ? <div className="tooltip-section"><small>STATUS</small><p>Protected<br />Cannot be consumed by this upgrade.</p></div> : null
  const output = getItemSources(itemId).find((relation) => relation.kind === 'recipe' && relation.detail.endsWith('output'))
  const uses = getItemUses(itemId)
  const [usesOpen, setUsesOpen] = useState(false)
  const drop = getItemDropSources(itemId)[0]
  const openInventory = () => { setNavigationIntent({ inventoryItemId: itemId }); state.setScreen('inventory') }
  const openWhere = () => { if (drop) setNavigationIntent({ combatDungeonId: drop.dungeonId, combatMonsterId: drop.monsterId }); state.setScreen(drop ? 'combat' : item.sourceNavigation ?? 'inventory') }
  const openMenu = (x: number, y: number, anchor?: HTMLElement) => openContextMenu({ x, y, anchor, header: { title: item.name, meta: `REQUIREMENT · ${available} / ${required}` }, sections: buildItemContextSections({ itemId, owned, protectedItem, source: 'reference', onOpenInventory: openInventory, onWhereToGet: openWhere, onOpenUses: uses.length > 0 ? () => setUsesOpen(true) : undefined, onOpenArtificing: output?.detail === 'Artificing output' ? () => { setUiPreferences({ screenState: { artificing: { selectedRecipeId: output.id as never } } }); state.setScreen('tower-artificing') } : undefined, onOpenTransmutation: output?.detail === 'Transmutation output' ? () => { setUiPreferences({ screenState: { transmutation: { selectedRecipeId: output.id as never } } }); state.setScreen('tower-transmutation') } : undefined, onTrack: () => setUiPreferences({ trackedItemId: preferences.trackedItemId === itemId ? null : itemId }) }) })
  return <><GameTooltip block accent={missing > 0 ? 'warning' : protectedItem ? 'danger' : 'elemental'} content={<ItemTooltipContent itemId={itemId} owned={owned} protectedItem={protectedItem} extraContent={<><div className="tooltip-section"><small>REQUIREMENT</small><TooltipRow label="Owned" value={owned} /><TooltipRow label="Equipped / Reserved" value={equipped} /><TooltipRow label="Available" value={available} /><TooltipRow label="Required" value={required} /><TooltipRow label="Missing" value={missing} /></div>{status}</>} />}>
    <span className={`item-requirement-tile ${stateClass}`} tabIndex={0} role="img" aria-label={`${item.name}, ${available} available, ${required} required${protectedItem ? ', protected' : ''}`} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openMenu(event.clientX, event.clientY) }} onKeyDown={(event) => { if (event.shiftKey && event.key === 'F10') { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); openMenu(rect.left, rect.bottom, event.currentTarget) } }}>
      <span className="item-requirement-icon-well"><ItemIcon itemId={itemId} size="tiny" /></span>
      <span className="item-requirement-quantity">{available} / {required}</span>
      {protectedItem && <i className="item-requirement-lock" aria-hidden="true">🔒</i>}
    </span>
  </GameTooltip><ItemUsesDialog itemId={itemId} uses={uses} open={usesOpen} onClose={() => setUsesOpen(false)} onSelectRecipe={(recipeId) => { setUsesOpen(false); if (isTransmutationRecipeId(recipeId)) { setNavigationIntent({ transmutationRecipeId: recipeId }); state.setScreen('tower-transmutation') } else { setNavigationIntent({ artificingRecipeId: recipeId as never }); state.setScreen('tower-artificing') } }} /></>
}

function TooltipRow({ label, value }: { label: string; value: number }) { return <span className="tooltip-row"><span>{label}</span><b>{value}</b></span> }
