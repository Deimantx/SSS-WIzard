import { Check, Lock } from 'lucide-react'
import { ItemIcon, ItemTooltip } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import type { GameState, ItemId } from '../../game/types'

export function InventoryItemTile({ itemId, inventory, protectedItems, equipment, selected, onSelect }: { itemId: ItemId; inventory: GameState['inventory']; protectedItems: GameState['protectedItems']; equipment: GameState['equipment']; selected: boolean; onSelect: () => void }) {
  const item = ITEMS[itemId]
  const equipped = Object.values(equipment).includes(itemId)
  const protectedItem = Boolean(protectedItems[itemId]) || equipped
  return <ItemTooltip itemId={itemId} owned={inventory[itemId] ?? 0} protectedItem={protectedItem} equipped={equipped}><button type="button" className={`inventory-item inventory-item-category-${item.category} ${selected ? 'selected' : ''} ${protectedItem ? 'protected' : ''} ${equipped ? 'equipped' : ''}`} onClick={onSelect} aria-label={`${item.name}, quantity ${inventory[itemId] ?? 0}${selected ? ', selected' : ''}`} aria-pressed={selected}>
    <span className="inventory-item-badge">{equipped ? <Check size={12} /> : protectedItem ? <Lock size={11} /> : null}</span>
    <ItemIcon itemId={itemId} size="tile" />
    <span className="inventory-item-quantity">×{inventory[itemId] ?? 0}</span>
    <strong>{item.name}</strong>
  </button></ItemTooltip>
}
