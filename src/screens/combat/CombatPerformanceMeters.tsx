import { HeartPulse, ShieldAlert, Swords } from 'lucide-react'
import { GameTooltip } from '../../components/ui'
import { useCombatTelemetryStore } from '../../game/telemetry/combat/combatTelemetryStore'
import { getCombatMetricSnapshot } from '../../game/telemetry/combat/combatTelemetrySelectors'
import type { CombatTelemetryActor, CombatTelemetryMetric, CombatTelemetryScope } from '../../game/telemetry/combat/combatTelemetryTypes'
import { CombatMetricTooltip } from './CombatMetricTooltip'

const metrics: Array<{ id: CombatTelemetryMetric; label: string; icon: typeof Swords; accent: 'warning' | 'success' | 'danger' }> = [
  { id: 'damage', label: 'DAMAGE', icon: Swords, accent: 'warning' },
  { id: 'healing', label: 'HEALING', icon: HeartPulse, accent: 'success' },
  { id: 'taken', label: 'TAKEN', icon: ShieldAlert, accent: 'danger' },
]

export function CombatPerformanceMeters({ actor, scope }: { actor: CombatTelemetryActor; scope: 'run' | 'encounter' }) {
  const telemetryScope = useCombatTelemetryStore((state) => scope === 'run' ? state.run ?? state.lastRun : state.encounter)
  const scopeLabel = actor === 'player' ? telemetryScope?.scopeId.startsWith('last') ? 'LAST RUN' : 'RUN' : 'ENCOUNTER'
  return <section className={`combat-performance combat-performance-${actor}`} aria-label={`${actor === 'player' ? 'Player' : 'Enemy'} Combat Performance`}><div className="combat-performance-head"><span className="combat-subsection-label">COMBAT PERFORMANCE</span><strong>{scopeLabel}</strong></div><div className="combat-performance-rows">{metrics.map(({ id, label, icon: Icon, accent }) => <PerformanceRow key={id} actor={actor} label={label} metric={id} scope={telemetryScope} icon={<Icon aria-hidden="true" />} accent={accent} />)}</div></section>
}

function PerformanceRow({ actor, label, metric, scope, icon, accent }: { actor: CombatTelemetryActor; label: string; metric: CombatTelemetryMetric; scope: CombatTelemetryScope | null; icon: React.ReactNode; accent: 'warning' | 'success' | 'danger' }) {
  const snapshot = getCombatMetricSnapshot(scope, actor, metric)
  const content = scope ? <CombatMetricTooltip metric={metric} actor={actor} scope={scope} snapshot={snapshot} /> : <div>No active combat telemetry yet.</div>
  return <GameTooltip block wide accent={accent} content={content}><div className={`combat-performance-row metric-${metric}`} tabIndex={0} aria-label={`${label} ${snapshot.total} total, ${snapshot.rate.toFixed(1)} per second`}><span className="combat-performance-icon">{icon}</span><strong>{label}</strong><b>{snapshot.rate.toFixed(1)}/s</b><small>{snapshot.total.toLocaleString()}</small></div></GameTooltip>
}
