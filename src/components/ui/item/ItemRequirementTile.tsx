import { ITEMS } from '../../../game/content/items/items'
import type { ItemId } from '../../../game/types'
import { GameTooltip } from '../tooltip/Tooltip'
import { ItemIcon } from './ItemIcon'
import { ItemTooltipContent } from './ItemTooltip'

export function ItemRequirementTile({ itemId, owned, required, available = owned, equipped = 0, protectedItem, source }: { itemId: ItemId; owned: number; required: number; available?: number; equipped?: number; protectedItem: boolean; source: string }) {
  const item = ITEMS[itemId]
  const missing = Math.max(0, required - available)
  const stateClass = protectedItem ? 'is-protected' : missing > 0 ? 'missing' : 'sufficient'
  const status = protectedItem ? <div className="tooltip-section"><small>STATUS</small><p>Protected<br />Cannot be consumed by this upgrade.</p></div> : null
  return <GameTooltip block accent={missing > 0 ? 'warning' : protectedItem ? 'danger' : 'elemental'} content={<ItemTooltipContent itemId={itemId} owned={owned} protectedItem={protectedItem} extraContent={<><div className="tooltip-section"><small>REQUIREMENT</small><TooltipRow label="Owned" value={owned} /><TooltipRow label="Equipped / Reserved" value={equipped} /><TooltipRow label="Available" value={available} /><TooltipRow label="Required" value={required} /><TooltipRow label="Missing" value={missing} /></div><div className="tooltip-section"><small>SOURCE</small><p>{source}</p></div>{status}</>} />}>
    <span className={`item-requirement-tile ${stateClass}`} tabIndex={0} role="img" aria-label={`${item.name}, ${available} available, ${required} required${protectedItem ? ', protected' : ''}`}>
      <span className="item-requirement-icon-well"><ItemIcon itemId={itemId} size="tiny" /></span>
      <span className="item-requirement-quantity">{available} / {required}</span>
      {protectedItem && <i className="item-requirement-lock" aria-hidden="true">🔒</i>}
    </span>
  </GameTooltip>
}

function TooltipRow({ label, value }: { label: string; value: number }) { return <span className="tooltip-row"><span>{label}</span><b>{value}</b></span> }
