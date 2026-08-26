import { GameTooltip, TooltipContent } from '../tooltip/Tooltip'
import { ITEMS } from '../../../game/content/items/items'
import type { ItemId } from '../../../game/types'
import { ItemIcon } from './ItemIcon'

export function ItemRequirementTile({ itemId, owned, required, available = owned, equipped = 0, protectedItem, source }: { itemId: ItemId; owned: number; required: number; available?: number; equipped?: number; protectedItem: boolean; source: string }) {
  const item = ITEMS[itemId]
  const missing = Math.max(0, required - available)
  const stateClass = protectedItem ? 'is-protected' : missing > 0 ? 'missing' : 'sufficient'
  const status = protectedItem ? <div className="tooltip-section"><small>STATUS</small><p>Protected<br />Cannot be consumed by this upgrade.</p></div> : null
  return <GameTooltip block accent={missing > 0 ? 'warning' : protectedItem ? 'danger' : 'elemental'} content={<TooltipContent title={item.name.toUpperCase()} description={categoryDescription(item.materialSubtype)}><TooltipRow label="Owned" value={owned} /><TooltipRow label="Equipped / Reserved" value={equipped} /><TooltipRow label="Available" value={available} /><TooltipRow label="Required" value={required} /><TooltipRow label="Missing" value={missing} /><div className="tooltip-section"><small>SOURCE</small><p>{source}</p></div>{status}</TooltipContent>}>
    <span className={`item-requirement-tile ${stateClass}`} tabIndex={0} role="img" aria-label={`${item.name}, ${available} available, ${required} required${protectedItem ? ', protected' : ''}`}>
      <span className="item-requirement-icon-well"><ItemIcon itemId={itemId} size="tiny" /></span>
      <span className="item-requirement-quantity">{available} / {required}</span>
      {protectedItem && <i className="item-requirement-lock" aria-hidden="true">🔒</i>}
    </span>
  </GameTooltip>
}

function categoryDescription(subtype?: string) { return subtype ? `${subtype.charAt(0).toUpperCase()}${subtype.slice(1)} Material` : 'Material' }
function TooltipRow({ label, value }: { label: string; value: number }) { return <span className="tooltip-row"><span>{label}</span><b>{value}</b></span> }
