import { Check, Lock } from 'lucide-react'
import { ItemIcon, ItemQuantity, ItemTooltip } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import { getItemDropSources, getItemSources } from '../../game/content/contentRelations'
import { getItemUses } from '../../game/content/items/inventoryMetadata'
import { evaluateEquipmentChange, getEquippedPositions } from '../../game/core/equipment'
import type { ArtifactId, EquipmentPosition, GameState, ItemId, ScreenId } from '../../game/types'
import { getInventoryAccentClass } from '../../game/content/items/inventoryMetadata'
import type { ItemFlow, ItemFlowDirection } from '../../game/systems/inventory/itemFlow'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { buildItemContextSections } from '../../ui/context-menu/itemContextActions'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { isArtifactItem } from '../../game/systems/artifacts/artifactProgression'

export function InventoryItemTile({ itemId, inventory, protectedItems, equipment, selected, newItem = false, flow, flowDirection, onSelect, onNavigate, onToggleProtection, onTrack, tracked, onOpenUses, onOpenArtifactPath, onEquip, onUnequip }: {
  itemId: ItemId
  inventory: GameState['inventory']
  protectedItems: GameState['protectedItems']
  equipment: GameState['equipment']
  selected: boolean
  newItem?: boolean
  flow?: ItemFlow | null
  flowDirection?: ItemFlowDirection
  onSelect: () => void
  onNavigate: (screen: ScreenId) => void
  onToggleProtection: (itemId: ItemId) => void
  onTrack: (itemId: ItemId) => void
  tracked: boolean
  onOpenUses?: (itemId: ItemId) => void
  onOpenArtifactPath?: (itemId: ArtifactId) => void
  onEquip: (itemId: ItemId, targetPosition?: EquipmentPosition) => void
  onUnequip: (position: EquipmentPosition) => void
}) {
  const item = ITEMS[itemId]
  const quantity = inventory[itemId] ?? 0
  const equipped = Object.values(equipment).includes(itemId)
  const protectedItem = Boolean(protectedItems[itemId]) || equipped
  const equippedPositions = getEquippedPositions({ equipment }, itemId)
  const { openContextMenu } = useGameContextMenu()
  const flowGlyph = flowDirection === 'production' ? '↑' : flowDirection === 'consumption' ? '↓' : flowDirection === 'mixed' ? '↕' : null

  const openMenu = (x: number, y: number, anchor?: HTMLElement) => {
    const outputRelations = getItemSources(itemId).filter((relation) => relation.kind === 'recipe' && relation.detail.endsWith('output'))
    const artificingOutput = outputRelations.find((relation) => relation.detail === 'Artificing output')
    const transmutationOutput = outputRelations.find((relation) => relation.detail === 'Transmutation output')
    const recipeUses = getItemUses(itemId).filter((use) => Boolean(use.recipeId))
    const equipTargets = item.kind === 'equipment' && !equipped
      ? item.equipmentSlot === 'ring'
        ? (['ring1', 'ring2'] as const).map((position) => ({ position, result: evaluateEquipmentChange({ inventory, equipment }, itemId, position) })).filter((entry) => entry.result.ok)
        : [evaluateEquipmentChange({ inventory, equipment }, itemId)].filter((entry): entry is { ok: true; position: EquipmentPosition; nextEquipment: GameState['equipment']; removedOffhand: ItemId | null } => entry.ok).map((result) => ({ position: result.position, result }))
      : []
    const quickEquipOptions = equipTargets.length > 1 ? equipTargets.map(({ position }) => ({ label: `Equip to ${position === 'ring1' ? 'Ring 1' : 'Ring 2'}`, onSelect: () => onEquip(itemId, position) })) : undefined
    const quickEquip = equipTargets.length === 1 ? () => onEquip(itemId, equipTargets[0].position) : undefined
    const quickUnequipOptions = equippedPositions.map((position) => ({ label: `Unequip ${position === 'ring1' ? 'Ring 1' : position === 'ring2' ? 'Ring 2' : position[0].toUpperCase() + position.slice(1)}`, onSelect: () => onUnequip(position) }))
    const navigateWithItem = (screen: ScreenId) => { setNavigationIntent({ inventoryItemId: itemId }); onNavigate(screen) }
    const firstDrop = getItemDropSources(itemId)[0]
    openContextMenu({ x, y, anchor, header: { title: item.name, meta: `${item.kind.toUpperCase()} · OWNED ${quantity}` }, sections: buildItemContextSections({
      itemId,
      owned: quantity,
      protectedItem,
      equipped,
      tracked,
      source: 'inventory',
      onQuickEquip: quickEquip,
      quickEquipOptions,
      quickUnequipOptions: quickUnequipOptions.length > 1 ? quickUnequipOptions : undefined,
      onQuickUnequip: quickUnequipOptions.length === 1 ? quickUnequipOptions[0].onSelect : undefined,
      onCompare: item.kind === 'equipment' ? () => { setNavigationIntent({ equipmentItemId: itemId, equipmentPosition: equippedPositions[0] ?? null }); onNavigate('equipment') } : undefined,
      onOpenArtifactPath: isArtifactItem(itemId) && onOpenArtifactPath ? () => onOpenArtifactPath(itemId) : undefined,
      onResearch: item.researchSchool ? () => { setNavigationIntent({ researchItemId: itemId, researchSchoolId: null }); onNavigate('tower-research') } : undefined,
      onOpenArtificing: artificingOutput ? () => { setNavigationIntent({ artificingRecipeId: artificingOutput.id as never }); onNavigate('tower-artificing') } : undefined,
      onOpenTransmutation: transmutationOutput ? () => { setNavigationIntent({ transmutationRecipeId: transmutationOutput.id as never }); onNavigate('tower-transmutation') } : undefined,
      onOpenUses: recipeUses.length > 0 && onOpenUses ? () => onOpenUses(itemId) : undefined,
      onWhereToGet: () => { if (firstDrop) setNavigationIntent({ combatDungeonId: firstDrop.dungeonId, combatMonsterId: firstDrop.monsterId }); else setNavigationIntent({ inventoryItemId: itemId }); onNavigate(firstDrop ? 'combat' : item.sourceNavigation ?? 'inventory') },
      onTrack: () => onTrack(itemId),
      onToggleProtection: () => onToggleProtection(itemId),
      onOpenCollection: () => { setNavigationIntent({ inventoryItemId: itemId }); onNavigate('collection') },
      onNavigate: navigateWithItem,
    }) })
  }

  return <ItemTooltip itemId={itemId} owned={quantity} protectedItem={protectedItem} equipped={equipped} flow={flow}>
    <button type="button" data-item-id={itemId} className={`inventory-item ${getInventoryAccentClass(itemId)} ${selected ? 'selected' : ''} ${protectedItem ? 'protected' : ''} ${equipped ? 'equipped' : ''} ${newItem ? 'is-new' : ''}`} onClick={onSelect} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openMenu(event.clientX, event.clientY) }} onKeyDown={(event) => { if (event.shiftKey && event.key === 'F10') { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); openMenu(rect.left, rect.bottom, event.currentTarget) } }} aria-label={`${item.name}, quantity ${quantity}${selected ? ', selected' : ''}${equipped ? ', equipped' : ''}${protectedItem && !equipped ? ', protected' : ''}${newItem ? ', new' : ''}`} aria-pressed={selected}>
      {newItem && <span className="inventory-new-badge">NEW</span>}
      {flowGlyph && <span className={`inventory-flow-indicator inventory-flow-${flowDirection}`} aria-label={flowDirection === 'production' ? 'Actively produced' : flowDirection === 'consumption' ? 'Actively consumed' : 'Actively produced and consumed'}>{flowGlyph}</span>}
      <span className="inventory-item-state" aria-hidden="true">{equipped ? <Check size={13} /> : protectedItem ? <Lock size={12} /> : null}</span>
      <span className="inventory-item-art"><ItemIcon itemId={itemId} size="tile" /><ItemQuantity value={quantity} compact /></span>
      <strong>{item.name}</strong>
      <span className="inventory-item-status">{equipped ? 'EQUIPPED' : protectedItem ? 'PROTECTED' : newItem ? 'NEW' : 'AVAILABLE'}</span>
    </button>
  </ItemTooltip>
}
