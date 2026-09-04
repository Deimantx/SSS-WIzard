import { Check } from 'lucide-react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon, ItemQuantity } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import type { ItemId } from '../../game/types'

export function CollectionItemCard({ itemId, discovered, quantity, selected, newItem = false, onSelect }: { itemId: ItemId; discovered: boolean; quantity: number; selected: boolean; newItem?: boolean; onSelect: () => void }) {
  const item = ITEMS[itemId]
  const card = <button type="button" className={`archive-entry-card collection-item-card ${discovered ? 'discovered' : 'undiscovered'} ${selected ? 'selected' : ''}`} onClick={onSelect} aria-label={discovered ? `${item.name}, owned ${quantity}${selected ? ', selected' : ''}` : 'Undiscovered item'} aria-pressed={selected}>
    <span className="archive-entry-art collection-item-art">{discovered ? <ItemIcon itemId={itemId} size="tile" /> : <span className="collection-unknown-mark">?</span>}</span>
    <span className="collection-item-copy"><strong>{discovered ? item.name : 'Undiscovered'}</strong><small>{discovered ? <>Owned <ItemQuantity value={quantity} compact /></> : 'Undiscovered'}</small></span>
    {discovered && <Check className="collection-item-check" size={14} aria-hidden="true" />}
    {discovered && newItem && <span className="archive-new-badge">NEW</span>}
  </button>
  return <GameTooltip block content={<TooltipContent title={discovered ? item.name : 'Undiscovered Item'} description={discovered ? `${item.inventoryCategory} · Owned ${quantity.toLocaleString()}` : 'Acquire it once to reveal this archive entry.'} />}>{card}</GameTooltip>
}
