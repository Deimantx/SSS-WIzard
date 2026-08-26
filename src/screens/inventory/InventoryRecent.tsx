import { ArrowUpRight, Clock3 } from 'lucide-react'
import { ItemIcon, ItemTooltip } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import type { GameState, ItemId } from '../../game/types'
import type { RecentAcquisition } from '../../store/gameStore'

export function InventoryRecent({ entries, inventory, protectedItems = {}, equipment = { weapon: null, robe: null, focus: null, charm: null }, onSelect }: { entries: readonly RecentAcquisition[]; inventory: GameState['inventory']; protectedItems?: GameState['protectedItems']; equipment?: GameState['equipment']; onSelect: (itemId: ItemId) => void }) {
  const visible = entries.filter((entry) => (inventory[entry.itemId] ?? 0) > 0)
  if (visible.length === 0) return null
  return <section className="inventory-recent" aria-labelledby="inventory-recent-heading">
    <div className="inventory-section-heading"><span id="inventory-recent-heading"><Clock3 size={13} /> Recent</span><small>Latest gains this session</small></div>
    <div className="inventory-recent-list">{visible.map((entry) => <ItemTooltip key={entry.itemId} itemId={entry.itemId} owned={inventory[entry.itemId] ?? 0} recentlyGained={entry.amount} protectedItem={Boolean(protectedItems[entry.itemId]) || Object.values(equipment).includes(entry.itemId)} equipped={Object.values(equipment).includes(entry.itemId)}>
      <button type="button" className="inventory-recent-item" onClick={() => onSelect(entry.itemId)} aria-label={`Select ${ITEMS[entry.itemId].name}, recently gained plus ${entry.amount}`}>
        <span className="inventory-recent-icon"><ItemIcon itemId={entry.itemId} size="tiny" /></span><span><strong>{ITEMS[entry.itemId].name}</strong><small>+{entry.amount.toLocaleString()}</small></span><ArrowUpRight size={13} aria-hidden="true" />
      </button>
    </ItemTooltip>)}</div>
  </section>
}
