import { Card, GameTooltip, Progress, Status } from '../../../components/ui'
import { TooltipContent, type TooltipAccent } from '../../../components/ui/tooltip/Tooltip'
import { getFocusCapacityBreakdown } from '../../../game/systems/focus/focusCapacity'
import { formatNumber } from '../../../game/utils'
import { selectRawFreeFocus, selectUsedFocus } from '../../../store/selectors'
import { useGameStore } from '../../../store/gameStore'

export function FocusOverviewPanel() {
  const state = useGameStore()
  const breakdown = getFocusCapacityBreakdown(state)
  const used = selectUsedFocus(state)
  const rawFree = selectRawFreeFocus(state)
  const free = Math.max(0, rawFree)
  const utilization = breakdown.total > 0 ? used / breakdown.total * 100 : 0
  const pressure = rawFree < 0 ? 'over-cap' : utilization >= 90 ? 'high' : utilization >= 70 ? 'warning' : 'normal'
  const pressureLabel = pressure === 'over-cap' ? `OVER CAP BY ${formatNumber(Math.abs(rawFree))}` : pressure === 'high' ? 'HIGH PRESSURE' : pressure === 'warning' ? 'TIGHT CAPACITY' : 'HEALTHY'
  return <Card className={`focus-overview focus-pressure-${pressure}`} title="FOCUS OVERVIEW" action={<Status tone={pressure === 'normal' ? 'success' : pressure === 'over-cap' || pressure === 'high' ? 'warning' : 'neutral'}>{pressureLabel}</Status>}>
    <div className="focus-overview-metrics">
      <Metric label="MAX FOCUS" value={breakdown.total} description="Total Focus capacity from the base tower, progression, permanent rewards, equipment, and developer overrides." accent="focus" />
      <Metric label="RESERVED" value={used} description="Focus currently reserved by active Channeling, Research, Transmutation, and Auto-Cast systems." accent="warning" />
      <Metric label="FREE" value={free} description="Focus available for another automated system. Gameplay clamps this to zero when reservations exceed capacity." accent="success" />
      <Metric label="UTILIZATION" value={`${Math.round(utilization)}%`} description="Reserved Focus as a percentage of Max Focus. 70% is a warning, 90% is high pressure, and values above 100% indicate a developer over-cap state." accent="warning" />
    </div>
    <div className="focus-allocation-bar">
      <Progress value={breakdown.total ? used / breakdown.total * 100 : 0} tone="gold" label="FOCUS ALLOCATION" right={`${formatNumber(used)} / ${formatNumber(breakdown.total)}`} />
      {rawFree < 0 && <strong>OVER CAP BY {formatNumber(Math.abs(rawFree))}</strong>}
    </div>
    <div className="focus-capacity-sources">
      <span className="eyebrow">CAPACITY SOURCES</span>
      <CapacityRow label="Base Tower Focus" value={breakdown.base} />
      <CapacityRow label="Focus Improvement" value={breakdown.improvement} />
      <CapacityRow label="Permanent Rewards" value={breakdown.permanentRewards} />
      <CapacityRow label="Equipment" value={breakdown.equipment} />
      {breakdown.debug !== 0 && <CapacityRow label="Developer Override" value={breakdown.debug} debug />}
      <CapacityRow label="TOTAL" value={breakdown.total} total />
    </div>
  </Card>
}

function Metric({ label, value, description, accent }: { label: string; value: number | string; description: string; accent: TooltipAccent }) {
  return <GameTooltip block accent={accent} content={<TooltipContent title={label} description={description} />}><div className="focus-metric" tabIndex={0}><span>{label}</span><strong>{typeof value === 'number' ? formatNumber(value) : value}</strong></div></GameTooltip>
}

function CapacityRow({ label, value, total = false, debug = false }: { label: string; value: number; total?: boolean; debug?: boolean }) {
  return <div className={`focus-capacity-row ${total ? 'total' : ''} ${debug ? 'debug' : ''}`}><span>{label}</span><strong>{value >= 0 ? '+' : ''}{formatNumber(value)}</strong></div>
}
