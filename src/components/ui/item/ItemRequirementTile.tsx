import { GameTooltip, TooltipContent } from '../tooltip/Tooltip'
import { ITEMS } from '../../../game/content/items/items'
import type { ItemId } from '../../../game/types'

export function ItemRequirementTile({ itemId, owned, required, protectedItem, source }: { itemId: ItemId; owned: number; required: number; protectedItem: boolean; source: string }) {
  const item = ITEMS[itemId]
  const missing = Math.max(0, required - owned)
  const stateClass = protectedItem ? 'is-protected' : missing > 0 ? 'missing' : 'sufficient'
  const status = protectedItem ? <div className="tooltip-section"><small>STATUS</small><p>Protected<br />Cannot be consumed by this upgrade.</p></div> : null
  return <GameTooltip block accent={missing > 0 ? 'warning' : protectedItem ? 'danger' : 'elemental'} content={<TooltipContent title={item.name.toUpperCase()} description={item.category === 'elemental' ? 'Elemental Material' : 'Monster Material'}><TooltipRow label="Owned" value={owned} /><TooltipRow label="Required" value={required} /><TooltipRow label="Missing" value={missing} /><div className="tooltip-section"><small>SOURCE</small><p>{source}</p></div>{status}</TooltipContent>}>
    <span className={`item-requirement-tile ${stateClass}`} tabIndex={0} role="img" aria-label={`${item.name}, ${owned} owned, ${required} required${protectedItem ? ', protected' : ''}`}>
      <span className="item-requirement-icon-well"><span className="item-requirement-icon" style={{ color: item.color }}>{item.icon}</span></span>
      <span className="item-requirement-quantity">{owned} / {required}</span>
      {protectedItem && <i className="item-requirement-lock" aria-hidden="true">🔒</i>}
    </span>
  </GameTooltip>
}

function TooltipRow({ label, value }: { label: string; value: number }) { return <span className="tooltip-row"><span>{label}</span><b>{value}</b></span> }
