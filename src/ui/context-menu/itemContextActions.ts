import { BookOpen, Library, MapPin, Pin, Shield, ShoppingBag, Sparkles, Swords, Wrench } from 'lucide-react'
import { ITEMS } from '../../game/content/items/items'
import type { ItemId, ScreenId } from '../../game/types'
import type { GameContextMenuSection } from './gameContextMenuTypes'

type ItemMenuSource = 'inventory' | 'collection' | 'reference'

/** Shared item capabilities; callers own exact cross-screen selection. */
export function buildItemContextSections({ itemId, owned, protectedItem, equipped, tracked = false, source = 'reference', onResearch, onToggleProtection, onQuickEquip, quickEquipOptions, onQuickUnequip, quickUnequipOptions, onCompare, onOpenArtifactPath, onOpenArtificing, onOpenTransmutation, onOpenUses, onWhereToGet, onTrack, onOpenInventory, onOpenCollection, onNavigate }: {
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
  onOpenArtifactPath?: () => void
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
    ...(quickEquipOptions?.length ? quickEquipOptions.map((option, index) => ({ id: `quick-equip-${index}`, icon: Swords, ...option })) : onQuickEquip ? [{ id: 'quick-equip', label: 'Quick Equip', icon: Swords, onSelect: onQuickEquip }] : []),
    ...(quickUnequipOptions?.length ? quickUnequipOptions.map((option, index) => ({ id: `quick-unequip-${index}`, icon: Swords, ...option })) : onQuickUnequip ? [{ id: 'quick-unequip', label: 'Quick Unequip', icon: Swords, onSelect: onQuickUnequip }] : []),
    ...(onCompare ? [{ id: 'compare', label: 'Compare Loadout', onSelect: onCompare }] : []),
    ...(onOpenArtifactPath ? [{ id: 'artifact-path', label: 'Artifact Path', icon: Sparkles, onSelect: onOpenArtifactPath }] : []),
  ]
  const craftingActions = [
    ...(onResearch ? [{ id: 'research', label: 'Research', icon: BookOpen, onSelect: onResearch }] : []),
    ...(onOpenArtificing ? [{ id: 'artificing', label: 'Open Artificing Recipe', icon: Wrench, onSelect: onOpenArtificing }] : []),
    ...(onOpenTransmutation ? [{ id: 'transmutation', label: 'Open Transmutation Recipe', icon: Wrench, onSelect: onOpenTransmutation }] : []),
    ...(onOpenUses ? [{ id: 'uses', label: 'Used In...', icon: Library, onSelect: onOpenUses }] : []),
    ...(onOpenInventory ? [{ id: 'inventory', label: 'Open in Inventory', icon: ShoppingBag, disabled: source === 'inventory', onSelect: onOpenInventory }] : []),
    ...(onOpenCollection ? [{ id: 'collection', label: 'Open Collection', icon: Library, disabled: source === 'collection', onSelect: onOpenCollection }] : []),
    ...(onWhereToGet && item.source ? [{ id: 'source', label: 'Where to Get', icon: MapPin, onSelect: onWhereToGet }] : []),
  ]
  const manageActions = [
    ...(onTrack ? [{ id: 'track', label: tracked ? 'Untrack Item' : 'Track Item', icon: Pin, onSelect: onTrack }] : []),
    ...(onToggleProtection && !equipped ? [{ id: 'protection', label: protectedItem ? 'Unprotect' : 'Protect', icon: Shield, onSelect: onToggleProtection }] : []),
    ...(onNavigate && !equipped ? [{ id: 'sell', label: 'Sell...', tone: 'warning' as const, disabled: owned <= 0, onSelect: () => onNavigate('inventory') }] : []),
  ]
  return [{ id: 'quick', actions: quickActions }, { id: 'crafting', actions: craftingActions }, { id: 'manage', actions: manageActions }].filter((section) => section.actions.length > 0)
}
