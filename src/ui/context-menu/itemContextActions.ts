import { BookOpen, Eye, Library, MapPin, Shield, ShoppingBag } from 'lucide-react'
import { ITEMS } from '../../game/content/items/items'
import type { ItemId } from '../../game/types'
import type { GameContextMenuSection } from './gameContextMenuTypes'

export function buildItemContextSections({ itemId, owned, protectedItem, equipped, onInspect, onResearch, onToggleProtection, onNavigate }: { itemId: ItemId; owned: number; protectedItem?: boolean; equipped?: boolean; onInspect: () => void; onResearch?: () => void; onToggleProtection?: () => void; onNavigate: (screen: 'inventory' | 'collection' | 'combat') => void }): GameContextMenuSection[] {
  const item = ITEMS[itemId]
  return [
    { id: 'inspect', actions: [{ id: 'inspect', label: 'INSPECT', icon: Eye, onSelect: onInspect }] },
    { id: 'links', actions: [ ...(onResearch ? [{ id: 'research', label: 'RESEARCH', icon: BookOpen, onSelect: onResearch }] : []), { id: 'inventory', label: 'OPEN IN INVENTORY', icon: ShoppingBag, onSelect: () => onNavigate('inventory') }, { id: 'collection', label: 'OPEN COLLECTION', icon: Library, onSelect: () => onNavigate('collection') }, { id: 'source', label: 'WHERE TO GET', icon: MapPin, disabled: !item.source, disabledReason: item.source ? undefined : 'No authored source', onSelect: () => onNavigate('combat') }] },
    { id: 'manage', actions: [ ...(onToggleProtection ? [{ id: 'protection', label: protectedItem ? (equipped ? 'PROTECTED WHILE EQUIPPED' : 'UNPROTECT') : 'PROTECT', icon: Shield, disabled: equipped, disabledReason: equipped ? 'Equipment copies are protected automatically' : undefined, onSelect: onToggleProtection }] : []), { id: 'sell', label: 'SELL...', tone: 'warning', disabled: owned <= 0, onSelect: () => onNavigate('inventory') }] },
  ]
}
