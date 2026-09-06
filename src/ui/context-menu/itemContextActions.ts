import { BookOpen, Library, MapPin, Pin, Shield, ShoppingBag, Swords, Wrench } from 'lucide-react'
import { ITEMS } from '../../game/content/items/items'
import type { ItemId, ScreenId } from '../../game/types'
import type { GameContextMenuSection } from './gameContextMenuTypes'

type ItemMenuSource = 'inventory' | 'collection' | 'reference'

/** Shared item capabilities; callers own exact cross-screen selection. */
export function buildItemContextSections({ itemId, owned, protectedItem, equipped, tracked = false, source = 'reference', onResearch, onToggleProtection, onQuickEquip, quickEquipOptions, onQuickUnequip, quickUnequipOptions, onCompare, onOpenArtificing, onOpenTransmutation, onOpenUses, onWhereToGet, onTrack, onOpenInventory, onOpenCollection, onNavigate }: {
  itemId: ItemId
  owned: number
  protectedItem?: boolean
  equipped?: boolean
  tracked?: boolean
  source?: ItemMenuSource
  onResearch?: () => void
  onToggleProtection?: () => void
  onQuickEquip?: () => void
  quickEquipOptions?: Array<{ label: string; onSelect: () => void; disabled?: boolean; disabledReason?: string }>
  onQuickUnequip?: () => void
  quickUnequipOptions?: Array<{ label: string; onSelect: () => void; disabled?: boolean; disabledReason?: string }>
  onCompare?: () => void
  onOpenArtificing?: () => void
  onOpenTransmutation?: () => void
  onOpenUses?: () => void
  onWhereToGet?: () => void
  onTrack?: () => void
  onOpenInventory?: () => void
  onOpenCollection?: () => void
  onNavigate?: (screen: ScreenId) => void
}): GameContextMenuSection[] {
  const item = ITEMS[itemId]
  const quickActions = [
    ...(quickEquipOptions?.length ? quickEquipOptions.map((option, index) => ({ id: `quick-equip-${index}`, icon: Swords, ...option })) : onQuickEquip ? [{ id: 'quick-equip', label: 'QUICK EQUIP', icon: Swords, onSelect: onQuickEquip }] : []),
    ...(quickUnequipOptions?.length ? quickUnequipOptions.map((option, index) => ({ id: `quick-unequip-${index}`, icon: Swords, ...option })) : onQuickUnequip ? [{ id: 'quick-unequip', label: 'QUICK UNEQUIP', icon: Swords, onSelect: onQuickUnequip }] : []),
    ...(onCompare ? [{ id: 'compare', label: 'COMPARE LOADOUT', onSelect: onCompare }] : []),
  ]
  const craftingActions = [
    ...(onResearch ? [{ id: 'research', label: 'RESEARCH', icon: BookOpen, onSelect: onResearch }] : []),
    ...(onOpenArtificing ? [{ id: 'artificing', label: 'OPEN ARTIFICING RECIPE', icon: Wrench, onSelect: onOpenArtificing }] : []),
    ...(onOpenTransmutation ? [{ id: 'transmutation', label: 'OPEN TRANSMUTATION RECIPE', icon: Wrench, onSelect: onOpenTransmutation }] : []),
    ...(onOpenUses ? [{ id: 'uses', label: 'USED IN...', icon: Library, onSelect: onOpenUses }] : []),
    ...(onOpenInventory ? [{ id: 'inventory', label: 'OPEN IN INVENTORY', icon: ShoppingBag, disabled: source === 'inventory', onSelect: onOpenInventory }] : []),
    ...(onOpenCollection ? [{ id: 'collection', label: 'OPEN COLLECTION', icon: Library, disabled: source === 'collection', onSelect: onOpenCollection }] : []),
    ...(onWhereToGet && item.source ? [{ id: 'source', label: 'WHERE TO GET', icon: MapPin, onSelect: onWhereToGet }] : []),
  ]
  const manageActions = [
    ...(onTrack ? [{ id: 'track', label: tracked ? 'UNTRACK ITEM' : 'TRACK ITEM', icon: Pin, onSelect: onTrack }] : []),
    ...(onToggleProtection && !equipped ? [{ id: 'protection', label: protectedItem ? 'UNPROTECT' : 'PROTECT', icon: Shield, onSelect: onToggleProtection }] : []),
    ...(onNavigate && !equipped ? [{ id: 'sell', label: 'SELL...', tone: 'warning' as const, disabled: owned <= 0, onSelect: () => onNavigate('inventory') }] : []),
  ]
  return [{ id: 'quick', actions: quickActions }, { id: 'crafting', actions: craftingActions }, { id: 'manage', actions: manageActions }].filter((section) => section.actions.length > 0)
}
