import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { CombatFocusReadiness } from '../../game/systems/focus/focusReservations'

export interface FocusBudgetMeterProps {
  readiness: CombatFocusReadiness
  compact?: boolean
}

/** Compact preparation meter: prepared Combat Focus is projected, not active. */
export function FocusBudgetMeter({ readiness, compact = false }: FocusBudgetMeterProps) {
  const scale = Math.max(1, readiness.maxFocus, readiness.projectedTotalFocus)
  const elsewhereWidth = Math.max(0, readiness.activeNonCombatFocus / scale * 100)
  const combatWidth = Math.max(0, readiness.combatFocusRequired / scale * 100)
  const freeWidth = Math.max(0, readiness.projectedFreeFocus / scale * 100)
  const short = readiness.missingFocus > 0 && !readiness.ready
  const meterLabel = short
    ? `${readiness.combatFocusRequired} Combat Focus required. ${readiness.activeNonCombatFocus} active elsewhere, ${readiness.availableForCombat} available, ${readiness.missingFocus} short.`
    : `${readiness.combatFocusRequired} Combat Focus required. ${readiness.activeNonCombatFocus} active elsewhere, ${readiness.availableForCombat} available.`
  return <div className={`focus-budget-meter${compact ? ' is-compact' : ''}${short ? ' is-over-cap' : ''}`} role="img" aria-label={meterLabel}>
    {!compact && <div className="focus-budget-meter-head"><span className="panel-kicker">COMBAT FOCUS</span><strong className="ui-focus">{readiness.combatFocusRequired} REQUIRED</strong></div>}
    <div className="focus-budget-track" aria-hidden="true">
      <span className="focus-budget-segment is-other" style={{ width: `${elsewhereWidth}%` }}><GameTooltip accent="neutral" content={<TooltipContent title="Active Elsewhere" description={`${readiness.activeNonCombatFocus} Focus held by Research, Transmutation, Channeling, and other active non-combat systems.`} />}><span className="focus-budget-segment-hitbox" /></GameTooltip></span>
      <span className="focus-budget-segment is-auto" style={{ width: `${combatWidth}%` }}><GameTooltip accent="focus" content={<TooltipContent title="Combat Focus Required" description={`${readiness.combatFocusRequired} Focus will become active when this prepared loadout starts combat.`} />}><span className="focus-budget-segment-hitbox" /></GameTooltip></span>
      <span className="focus-budget-segment is-free" style={{ width: `${freeWidth}%` }}><GameTooltip accent={short ? 'warning' : 'success'} content={<TooltipContent title={short ? 'Focus Short' : 'Projected Free Focus'} description={short ? `${readiness.missingFocus} more Focus is needed before this loadout can start combat.` : `${Math.max(0, readiness.projectedFreeFocus)} Focus remains after combat starts.`} />}><span className="focus-budget-segment-hitbox" /></GameTooltip></span>
    </div>
    <div className="focus-budget-meter-labels"><span><i className="is-auto" />Required <strong className="ui-focus">{readiness.combatFocusRequired}</strong></span><span><i className="is-other" />Active Elsewhere <strong className="ui-focus">{readiness.activeNonCombatFocus}</strong></span><span className={short ? 'is-warning' : ''}><i className="is-free" />{short ? 'Short' : 'Available'} <strong className="ui-focus">{short ? readiness.missingFocus : readiness.availableForCombat}</strong></span></div>
    {compact && <strong className={`focus-budget-meter-total ui-focus${short ? ' is-warning' : ''}`}>{short ? `${readiness.missingFocus} SHORT` : readiness.ready ? 'READY' : 'NOT READY'}</strong>}
  </div>
}
