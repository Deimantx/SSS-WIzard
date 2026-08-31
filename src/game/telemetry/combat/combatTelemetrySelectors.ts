import { getCombatMetricAggregate, getCombatMetricRate } from './combatTelemetryAggregator'
import type { CombatActorMetrics, CombatMetricBreakdownRow, CombatMetricSnapshot, CombatTelemetryActor, CombatTelemetryMetric, CombatTelemetryScope } from './combatTelemetryTypes'

export const getCombatTelemetryScope = (state: { run: CombatTelemetryScope | null; lastRun: CombatTelemetryScope | null; encounter: CombatTelemetryScope | null }, scope: 'run' | 'encounter'): CombatTelemetryScope | null => scope === 'run' ? state.run ?? state.lastRun : state.encounter

export const getCombatActorMetrics = (scope: CombatTelemetryScope | null, actor: CombatTelemetryActor): CombatActorMetrics | null => scope?.[actor] ?? null

export const getCombatMetricBreakdown = (scope: CombatTelemetryScope, actor: CombatTelemetryActor, metric: CombatTelemetryMetric, limit = 8): { rows: CombatMetricBreakdownRow[]; otherSources: number } => {
  const aggregate = getCombatMetricAggregate(scope, actor, metric)
  const sorted = Object.values(aggregate.bySource).filter((contribution) => contribution.total > 0).sort((left, right) => right.total - left.total)
  const rows = sorted.slice(0, limit).map((contribution) => ({ contribution, percent: aggregate.total > 0 ? contribution.total / aggregate.total * 100 : 0, rate: getCombatMetricRate(contribution.total, scope.engagedMs) }))
  return { rows, otherSources: Math.max(0, sorted.length - rows.length) }
}

export const getCombatMetricSnapshot = (scope: CombatTelemetryScope | null, actor: CombatTelemetryActor, metric: CombatTelemetryMetric): CombatMetricSnapshot => {
  if (!scope) return { total: 0, rate: 0, engagedMs: 0, rows: [], otherSources: 0, healthDamage: 0, barrierAbsorbed: 0, overheal: 0, barrierGranted: 0 }
  const aggregate = getCombatMetricAggregate(scope, actor, metric)
  const breakdown = getCombatMetricBreakdown(scope, actor, metric)
  const metrics = scope[actor]
  return {
    total: aggregate.total,
    rate: getCombatMetricRate(aggregate.total, scope.engagedMs),
    engagedMs: scope.engagedMs,
    rows: breakdown.rows,
    otherSources: breakdown.otherSources,
    healthDamage: metric === 'damage' ? Object.values(aggregate.bySource).reduce((total, source) => total + source.healthDamage, 0) : metric === 'taken' ? metrics.damageTaken.healthDamage : 0,
    barrierAbsorbed: metric === 'damage' ? Object.values(aggregate.bySource).reduce((total, source) => total + source.barrierAbsorbed, 0) : metric === 'taken' ? metrics.damageTaken.barrierAbsorbed : 0,
    overheal: metric === 'healing' ? Object.values(aggregate.bySource).reduce((total, source) => total + source.overheal, 0) : 0,
    barrierGranted: metric === 'healing' ? metrics.barrierGranted : 0,
  }
}
