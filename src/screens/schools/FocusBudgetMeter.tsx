import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'

export interface FocusBudgetMeterProps {
  autoCastFocus: number
  otherFocus: number
  totalFocus: number
  maxFocus: number
  freeFocus: number
  compact?: boolean
}

export function FocusBudgetMeter({ autoCastFocus, otherFocus, totalFocus, maxFocus, freeFocus, compact = false }: FocusBudgetMeterProps) {
  const scale = Math.max(1, maxFocus, totalFocus)
  const autoWidth = Math.max(0, autoCastFocus / scale * 100)
  const otherWidth = Math.max(0, otherFocus / scale * 100)
  const freeWidth = Math.max(0, freeFocus / scale * 100)
  const overCap = freeFocus < 0
  const meterLabel = overCap ? `${totalFocus} of ${maxFocus} Focus used. ${autoCastFocus} Auto-Cast, ${otherFocus} other systems, ${Math.abs(freeFocus)} over cap.` : `${totalFocus} of ${maxFocus} Focus used. ${autoCastFocus} Auto-Cast, ${otherFocus} other systems, ${freeFocus} free.`

  return <div className={`focus-budget-meter${compact ? ' is-compact' : ''}${overCap ? ' is-over-cap' : ''}`} role="img" aria-label={meterLabel}>
    {!compact && <div className="focus-budget-meter-head"><span className="panel-kicker">FOCUS BUDGET</span><strong className="ui-focus">{totalFocus} / {maxFocus}</strong></div>}
    <div className="focus-budget-track" aria-hidden="true">
      <span className="focus-budget-segment is-auto" style={{ width: `${autoWidth}%` }}><GameTooltip accent="focus" content={<TooltipContent title="Auto-Cast Focus" description={`${autoCastFocus} Focus reserved by the projected Auto-Cast loadout.`} />}><span /></GameTooltip></span>
      <span className="focus-budget-segment is-other" style={{ width: `${otherWidth}%` }}><GameTooltip accent="neutral" content={<TooltipContent title="Other Systems" description={`${otherFocus} Focus reserved by non-spell systems.`} />}><span /></GameTooltip></span>
      <span className="focus-budget-segment is-free" style={{ width: `${freeWidth}%` }}><GameTooltip accent="success" content={<TooltipContent title={overCap ? 'Over Cap' : 'Free Focus'} description={overCap ? `${Math.abs(freeFocus)} Focus over the current cap.` : `${freeFocus} Focus remains available.`} />}><span /></GameTooltip></span>
    </div>
    <div className="focus-budget-meter-labels"><span><i className="is-auto" />Auto-Cast <strong className="ui-focus">{autoCastFocus}</strong></span><span><i className="is-other" />Other Systems <strong className="ui-focus">{otherFocus}</strong></span><span className={overCap ? 'is-warning' : ''}><i className="is-free" />{overCap ? `${Math.abs(freeFocus)} Over Cap` : 'Free'} <strong className="ui-focus">{overCap ? `+${Math.abs(freeFocus)}` : freeFocus}</strong></span></div>
    {compact && <strong className={`focus-budget-meter-total ui-focus${overCap ? ' is-warning' : ''}`}>{totalFocus} / {maxFocus}</strong>}
  </div>
}
