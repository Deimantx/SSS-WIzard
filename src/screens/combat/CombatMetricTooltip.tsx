import { formatNumber, formatTime } from '../../game/utils'
import { presentCombatMetricSource } from '../../game/telemetry/combat/combatMetricSourcePresentation'
import type { CombatMetricSnapshot, CombatTelemetryMetric, CombatTelemetryScope, CombatTelemetryActor } from '../../game/telemetry/combat/combatTelemetryTypes'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'

const metricCopy: Record<CombatTelemetryMetric, { title: string; totalLabel: string; rateLabel: string; sourceLabel: string }> = {
  damage: { title: 'DAMAGE DONE', totalLabel: 'TOTAL', rateLabel: 'DPS', sourceLabel: 'SOURCE · DAMAGE · SHARE' },
  healing: { title: 'HEALING DONE', totalLabel: 'EFFECTIVE', rateLabel: 'HPS', sourceLabel: 'SOURCE · HEALING · SHARE' },
  taken: { title: 'DAMAGE TAKEN', totalLabel: 'TOTAL', rateLabel: 'DTPS', sourceLabel: 'SOURCE · DAMAGE · SHARE' },
}

const scopeLabel = (scope: CombatTelemetryScope, actor: CombatTelemetryActor) => `${actor === 'player' ? scope.scopeId.startsWith('last') ? 'LAST RUN' : 'CURRENT RUN' : 'CURRENT ENCOUNTER'} · ${formatTime(scope.engagedMs)} ENGAGED`

export function CombatMetricTooltip({ metric, actor, scope, snapshot }: { metric: CombatTelemetryMetric; actor: CombatTelemetryActor; scope: CombatTelemetryScope; snapshot: CombatMetricSnapshot }) {
  const copy = metricCopy[metric]
  return <TooltipContent title={copy.title} description={scopeLabel(scope, actor)}><div className={`combat-metric-tooltip combat-metric-tooltip-${metric}`}>
    <div className="combat-metric-tooltip-summary"><strong>{formatNumber(snapshot.total)} {copy.totalLabel}</strong><b>{snapshot.rate.toFixed(1)}/s <small>{copy.rateLabel}</small></b></div>
    <div className="tooltip-section combat-metric-tooltip-sources"><small>{copy.sourceLabel}</small>{snapshot.rows.length ? snapshot.rows.map(({ contribution, percent, rate }) => { const source = presentCombatMetricSource(contribution); return <div className="combat-metric-tooltip-source" key={contribution.key}><div className="combat-metric-tooltip-source-head"><span><strong className={`metric-source-accent-${source.accent}`}>{source.name}</strong><small>{source.subtitle}</small></span><b>{formatNumber(contribution.total)} · {percent.toFixed(1)}%</b></div><div className="combat-metric-tooltip-bar"><i className={`metric-accent-${source.accent}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} /></div><small className="combat-metric-tooltip-rate">{rate.toFixed(1)}/s · {contribution.events} events</small></div> }) : <p>No resolved combat events yet.</p>}{snapshot.otherSources > 0 && <p>+{snapshot.otherSources} other sources</p>}</div>
    {metric === 'damage' && (snapshot.healthDamage > 0 || snapshot.barrierAbsorbed > 0) && <div className="tooltip-section combat-metric-tooltip-secondary"><div className="tooltip-row"><span>HP DAMAGE</span><b>{formatNumber(snapshot.healthDamage)}</b></div><div className="tooltip-row"><span>BARRIER DAMAGE</span><b>{formatNumber(snapshot.barrierAbsorbed)}</b></div></div>}
    {metric === 'taken' && <div className="tooltip-section combat-metric-tooltip-secondary"><div className="tooltip-row"><span>HP DAMAGE</span><b>{formatNumber(snapshot.healthDamage)}</b></div><div className="tooltip-row"><span>BARRIER ABSORBED</span><b>{formatNumber(snapshot.barrierAbsorbed)}</b></div><p>Includes damage absorbed by Barrier.</p></div>}
    {metric === 'healing' && (snapshot.overheal > 0 || snapshot.barrierGranted > 0) && <div className="tooltip-section combat-metric-tooltip-secondary">{snapshot.overheal > 0 && <div className="tooltip-row"><span>OVERHEAL</span><b>{formatNumber(snapshot.overheal)} · {snapshot.total + snapshot.overheal > 0 ? (snapshot.overheal / (snapshot.total + snapshot.overheal) * 100).toFixed(1) : '0.0'}%</b></div>}{snapshot.barrierGranted > 0 && <div className="tooltip-row"><span>BARRIER GRANTED</span><b>{formatNumber(snapshot.barrierGranted)}</b></div>}</div>}
  </div>
  </TooltipContent>
}
