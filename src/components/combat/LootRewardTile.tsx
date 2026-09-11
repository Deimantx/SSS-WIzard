import { GameTooltip } from '../ui'
import { ItemIcon, ItemTooltipContent } from '../ui/item'
import { ITEMS } from '../../game/content/items/items'
import { formatDropChance, formatDropQuantity } from '../../game/systems/bestiary/bestiarySelectors'
import type { ItemId } from '../../game/types'

export interface LootRewardDrop {
  itemId: ItemId
  min: number
  max: number
  chance: number
}

interface LootRewardTileProps {
  drop: LootRewardDrop
  inventory: Partial<Record<ItemId, number>>
  sourceName?: string
  stateLabel?: string
  stateTone?: 'neutral' | 'success' | 'warning' | 'active' | 'locked'
}

/** Shared compact loot presentation for encounter and area reward surfaces. */
export function LootRewardTile({ drop, inventory, sourceName, stateLabel, stateTone = 'neutral' }: LootRewardTileProps) {
  const item = ITEMS[drop.itemId]
  const chance = formatDropChance(drop.chance)
  const quantity = formatDropQuantity(drop.min, drop.max)
  const isGuaranteed = drop.chance >= 1
  const stateDescription = stateLabel ?? (isGuaranteed ? 'Guaranteed' : undefined)
  const stateMarker = isGuaranteed ? '✓' : stateLabel ? stateLabel.slice(0, 1) : undefined
  const tooltipDetails = <div className="tooltip-section"><small>DROP</small><span className="tooltip-row"><span>Chance</span><b>{chance}</b></span><span className="tooltip-row"><span>Quantity</span><b>{quantity}</b></span>{sourceName && <span className="tooltip-row"><span>Source</span><b>{sourceName}</b></span>}</div>

  return <GameTooltip block wide content={<ItemTooltipContent itemId={drop.itemId} owned={inventory[drop.itemId] ?? 0} extraContent={tooltipDetails} />}>
    <div className={`combat-loot-reward-tile${stateMarker ? ' has-state' : ''}${isGuaranteed ? ' is-guaranteed' : ''}`} tabIndex={0} role="img" aria-label={[item.name, chance, `quantity ${quantity}`, stateDescription].filter(Boolean).join(': ')}>
      <div className="combat-loot-reward-head"><span className="combat-loot-reward-icon"><ItemIcon itemId={drop.itemId} size="tile" /></span>{stateMarker && <span className="combat-loot-reward-state" aria-label={stateDescription}>{stateMarker}</span>}</div>
      <div className="combat-loot-reward-meta"><span>{chance}</span><b>{quantity}</b></div>
    </div>
  </GameTooltip>
}
