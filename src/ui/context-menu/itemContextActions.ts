import { BookOpen, Library, MapPin, Shield, ShoppingBag, Swords, Wrench } from 'lucide-react'
import { ITEMS } from '../../game/content/items/items'
import type { ItemId } from '../../game/types'
import type { GameContextMenuSection } from './gameContextMenuTypes'

export function buildItemContextSections({ itemId, owned, protectedItem, equipped, source = 'reference', onResearch, onToggleProtection, onQuickEquip, onQuickUnequip, onCompare, onOpenArtificing, onNavigate }: { itemId: ItemId; owned: number; protectedItem?: boolean; equipped?: boolean; source?: 'inventory' | 'collection' | 'reference'; onResearch?: () => void; onToggleProtection?: () => void; onQuickEquip?: () => void; onQuickUnequip?: () => void; onCompare?: () => void; onOpenArtificing?: () => void; onNavigate: (screen: 'inventory' | 'collection' | 'combat') => void }): GameContextMenuSection[] {
  const item = ITEMS[itemId]
  return [
    { id: 'quick', actions: [ ...(onQuickEquip ? [{ id: 'quick-equip', label: 'QUICK EQUIP', icon: Swords, onSelect: onQuickEquip }] : []), ...(onQuickUnequip ? [{ id: 'quick-unequip', label: 'QUICK UNEQUIP', icon: Swords, onSelect: onQuickUnequip }] : []), ...(onCompare ? [{ id: 'compare', label: 'COMPARE LOADOUT', onSelect: onCompare }] : []) ] },
    { id: 'crafting', actions: [ ...(onOpenArtificing ? [{ id: 'artificing', label: 'OPEN ARTIFICING RECIPE', icon: Wrench, onSelect: onOpenArtificing }] : []), ...(onResearch ? [{ id: 'research', label: 'RESEARCH', icon: BookOpen, onSelect: onResearch }] : []), { id: 'inventory', label: 'OPEN IN INVENTORY', icon: ShoppingBag, disabled: source === 'inventory', onSelect: () => onNavigate('inventory') }, { id: 'collection', label: 'OPEN COLLECTION', icon: Library, disabled: source === 'collection', onSelect: () => onNavigate('collection') }, { id: 'source', label: 'WHERE TO GET', icon: MapPin, disabled: !item.source, disabledReason: item.source ? undefined : 'No authored source', onSelect: () => onNavigate('combat') } ] },
    { id: 'manage', actions: [ ...(onToggleProtection ? [{ id: 'protection', label: protectedItem ? (equipped ? 'PROTECTED WHILE EQUIPPED' : 'UNPROTECT') : 'PROTECT', icon: Shield, disabled: equipped, disabledReason: equipped ? 'Equipment copies are protected automatically' : undefined, onSelect: onToggleProtection }] : []), { id: 'sell', label: 'SELL...', tone: 'warning' as const, disabled: owned <= 0, onSelect: () => onNavigate('inventory') }] },
  ].filter((section) => section.actions.length)
}
