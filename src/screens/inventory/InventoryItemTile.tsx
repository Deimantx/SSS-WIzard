import { Check, Lock } from 'lucide-react'
import { ItemIcon, ItemQuantity, ItemTooltip } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import type { GameState, ItemId } from '../../game/types'
import { getInventoryAccentClass } from '../../game/content/items/inventoryMetadata'
import type { ItemFlow, ItemFlowDirection } from '../../game/systems/inventory/itemFlow'

export function InventoryItemTile({ itemId, inventory, protectedItems, equipment, selected, newItem = false, flow, flowDirection, onSelect }: { itemId: ItemId; inventory: GameState['inventory']; protectedItems: GameState['protectedItems']; equipment: GameState['equipment']; selected: boolean; newItem?: boolean; flow?: ItemFlow | null; flowDirection?: ItemFlowDirection; onSelect: () => void }) {
  const item = ITEMS[itemId]
  const quantity = inventory[itemId] ?? 0
  const equipped = Object.values(equipment).includes(itemId)
  const protectedItem = Boolean(protectedItems[itemId]) || equipped
  const flowGlyph = flowDirection === 'production' ? '↑' : flowDirection === 'consumption' ? '↓' : flowDirection === 'mixed' ? '↕' : null
  return <ItemTooltip itemId={itemId} owned={quantity} protectedItem={protectedItem} equipped={equipped} flow={flow}>
    <button type="button" data-item-id={itemId} className={`inventory-item ${getInventoryAccentClass(itemId)} ${selected ? 'selected' : ''} ${protectedItem ? 'protected' : ''} ${equipped ? 'equipped' : ''} ${newItem ? 'is-new' : ''}`} onClick={onSelect} aria-label={`${item.name}, quantity ${quantity}${selected ? ', selected' : ''}${equipped ? ', equipped' : ''}${protectedItem && !equipped ? ', protected' : ''}${newItem ? ', new' : ''}`} aria-pressed={selected}>
      {newItem && <span className="inventory-new-badge">NEW</span>}
      {flowGlyph && <span className={`inventory-flow-indicator inventory-flow-${flowDirection}`} aria-label={flowDirection === 'production' ? 'Actively produced' : flowDirection === 'consumption' ? 'Actively consumed' : 'Actively produced and consumed'}>{flowGlyph}</span>}
      <span className="inventory-item-state" aria-hidden="true">{equipped ? <Check size={13} /> : protectedItem ? <Lock size={12} /> : null}</span>
      <span className="inventory-item-art"><ItemIcon itemId={itemId} size="tile" /><ItemQuantity value={quantity} compact /></span>
      <strong>{item.name}</strong>
    </button>
  </ItemTooltip>
}
