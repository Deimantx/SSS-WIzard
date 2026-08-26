import { GameTooltip, TooltipContent } from '../tooltip/Tooltip'
import { ITEMS } from '../../../game/content/items/items'
import type { ItemId } from '../../../game/types'
import { ItemIcon } from './ItemIcon'

export function ItemRequirementTile({ itemId, owned, required, protectedItem, source }: { itemId: ItemId; owned: number; required: number; protectedItem: boolean; source: string }) {
  const item = ITEMS[itemId]
  const missing = Math.max(0, required - owned)
  const stateClass = protectedItem ? 'is-protected' : missing > 0 ? 'missing' : 'sufficient'
  const status = protectedItem ? <div className="tooltip-section"><small>STATUS</small><p>Protected<br />Cannot be consumed by this upgrade.</p></div> : null
  return <GameTooltip block accent={missing > 0 ? 'warning' : protectedItem ? 'danger' : 'elemental'} content={<TooltipContent title={item.name.toUpperCase()} description={categoryDescription(item.materialSubtype)}><TooltipRow label="Owned" value={owned} /><TooltipRow label="Required" value={required} /><TooltipRow label="Missing" value={missing} /><div className="tooltip-section"><small>SOURCE</small><p>{source}</p></div>{status}</TooltipContent>}>
    <span className={`item-requirement-tile ${stateClass}`} tabIndex={0} role="img" aria-label={`${item.name}, ${owned} owned, ${required} required${protectedItem ? ', protected' : ''}`}>
      <span className="item-requirement-icon-well"><ItemIcon itemId={itemId} size="tiny" /></span>
      <span className="item-requirement-quantity">{owned} / {required}</span>
      {protectedItem && <i className="item-requirement-lock" aria-hidden="true">🔒</i>}
    </span>
  </GameTooltip>
}

function categoryDescription(subtype?: string) { return subtype ? `${subtype.charAt(0).toUpperCase()}${subtype.slice(1)} Material` : 'Material' }
function TooltipRow({ label, value }: { label: string; value: number }) { return <span className="tooltip-row"><span>{label}</span><b>{value}</b></span> }
