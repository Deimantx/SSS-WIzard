import { Check, Lock } from 'lucide-react'
import { ItemIcon, ItemQuantity, ItemTooltip } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import type { GameState, ItemId } from '../../game/types'
import { getInventoryAccentClass } from './inventoryMetadata'

export function InventoryItemTile({ itemId, inventory, protectedItems, equipment, selected, newItem = false, onSelect }: { itemId: ItemId; inventory: GameState['inventory']; protectedItems: GameState['protectedItems']; equipment: GameState['equipment']; selected: boolean; newItem?: boolean; onSelect: () => void }) {
  const item = ITEMS[itemId]
  const quantity = inventory[itemId] ?? 0
  const equipped = Object.values(equipment).includes(itemId)
  const protectedItem = Boolean(protectedItems[itemId]) || equipped
  return <ItemTooltip itemId={itemId} owned={quantity} protectedItem={protectedItem} equipped={equipped}>
    <button type="button" data-item-id={itemId} className={`inventory-item ${getInventoryAccentClass(itemId)} ${selected ? 'selected' : ''} ${protectedItem ? 'protected' : ''} ${equipped ? 'equipped' : ''} ${newItem ? 'is-new' : ''}`} onClick={onSelect} aria-label={`${item.name}, quantity ${quantity}${selected ? ', selected' : ''}${equipped ? ', equipped' : ''}${protectedItem && !equipped ? ', protected' : ''}${newItem ? ', new' : ''}`} aria-pressed={selected}>
      {newItem && <span className="inventory-new-badge">NEW</span>}
      <span className="inventory-item-state" aria-hidden="true">{equipped ? <Check size={13} /> : protectedItem ? <Lock size={12} /> : null}</span>
      <span className="inventory-item-art"><ItemIcon itemId={itemId} size="tile" /><ItemQuantity value={quantity} compact /></span>
      <strong>{item.name}</strong>
    </button>
  </ItemTooltip>
}
