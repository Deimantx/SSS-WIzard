import { getCombatMetricAggregate, getCombatMetricRate } from '../../telemetry/combat/combatTelemetryAggregator'
import { presentCombatMetricSource, type CombatMetricSourcePresentation } from '../../telemetry/combat/combatMetricSourcePresentation'
import type { CombatMetricSourceContribution, CombatTelemetryMetric, CombatTelemetryScope } from '../../telemetry/combat/combatTelemetryTypes'

export type CombatDetailsMode = 'damage-done' | 'damage-taken' | 'healing'

export const COMBAT_DETAILS_MODE_ORDER: readonly CombatDetailsMode[] = ['damage-done', 'damage-taken', 'healing']

export interface CombatDetailsModeConfig {
  label: string
  metric: CombatTelemetryMetric
  totalLabel: string
  rateLabel: string
  colorToken: string
}

export const COMBAT_DETAILS_MODE_CONFIG: Record<CombatDetailsMode, CombatDetailsModeConfig> = {
  'damage-done': { label: 'DAMAGE DONE', metric: 'damage', totalLabel: 'TOTAL', rateLabel: 'DPS', colorToken: '--details-damage-done' },
  'damage-taken': { label: 'DAMAGE TAKEN', metric: 'taken', totalLabel: 'TOTAL', rateLabel: 'DTPS', colorToken: '--details-damage-taken' },
  healing: { label: 'HEALING', metric: 'healing', totalLabel: 'EFFECTIVE', rateLabel: 'HPS', colorToken: '--details-healing' },
}

export interface CombatDetailsSecondaryStat {
  label: string
  value: number
  compactValue: string
}

export interface CombatDetailsRowPresentation {
  key: string
  rank: number
  source: CombatMetricSourcePresentation
  contribution: CombatMetricSourceContribution
  total: number
  compactTotal: string
  percent: number
  rate: number
}

export interface CombatDetailsPresentation {
  mode: CombatDetailsMode
  config: CombatDetailsModeConfig
  scopeLabel: 'CURRENT RUN' | 'LAST RUN'
  total: number
  compactTotal: string
  rate: number
  engagedMs: number
  elapsedMs: number
  secondaryStats: CombatDetailsSecondaryStat[]
  rows: CombatDetailsRowPresentation[]
}

export const cycleCombatDetailsMode = (mode: CombatDetailsMode, direction: -1 | 1): CombatDetailsMode => {
  const index = COMBAT_DETAILS_MODE_ORDER.indexOf(mode)
  const safeIndex = index < 0 ? 0 : index
  return COMBAT_DETAILS_MODE_ORDER[(safeIndex + direction + COMBAT_DETAILS_MODE_ORDER.length) % COMBAT_DETAILS_MODE_ORDER.length]
}

export const formatCompactCombatValue = (value: number): string => {
  const safe = Math.max(0, Number.isFinite(value) ? value : 0)
  if (safe < 1_000) return Math.round(safe).toLocaleString()
  if (safe < 1_000_000) return `${trimCompact(safe / 1_000)}k`
  return `${trimCompact(safe / 1_000_000)}m`
}

const trimCompact = (value: number) => value >= 100 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, '')

const secondary = (label: string, value: number): CombatDetailsSecondaryStat => ({ label, value, compactValue: formatCompactCombatValue(value) })

export const getCombatDetailsPresentation = (scope: CombatTelemetryScope | null, mode: CombatDetailsMode): CombatDetailsPresentation => {
  const config = COMBAT_DETAILS_MODE_CONFIG[mode]
  const empty: CombatDetailsPresentation = { mode, config, scopeLabel: scope?.scopeId.startsWith('last-') ? 'LAST RUN' : 'CURRENT RUN', total: 0, compactTotal: '0', rate: 0, engagedMs: scope?.engagedMs ?? 0, elapsedMs: scope?.elapsedMs ?? 0, secondaryStats: [], rows: [] }
  if (!scope) return empty

  const metrics = scope.player
  const aggregate = getCombatMetricAggregate(scope, 'player', config.metric)
  const rows = Object.values(aggregate.bySource)
    .sort((left, right) => right.total - left.total || left.key.localeCompare(right.key))
    .map((contribution, index) => ({
      key: contribution.key,
      rank: index + 1,
      source: presentCombatMetricSource(contribution),
      contribution,
      total: contribution.total,
      compactTotal: formatCompactCombatValue(contribution.total),
      percent: aggregate.total > 0 ? contribution.total / aggregate.total * 100 : 0,
      rate: getCombatMetricRate(contribution.total, scope.engagedMs),
    }))

  const secondaryStats = mode === 'damage-done'
    ? [secondary('HP DAMAGE', metrics.damageDone.bySource ? sumContribution(metrics.damageDone.bySource, 'healthDamage') : 0), secondary('BARRIER DAMAGE', metrics.damageDone.bySource ? sumContribution(metrics.damageDone.bySource, 'barrierAbsorbed') : 0)].filter((stat) => stat.value > 0)
    : mode === 'damage-taken'
      ? [secondary('HP DAMAGE', metrics.damageTaken.healthDamage), secondary('BARRIER ABSORBED', metrics.damageTaken.barrierAbsorbed)]
      : [secondary('OVERHEAL', sumContribution(metrics.healingDone.bySource, 'overheal')), secondary('BARRIER GRANTED', metrics.barrierGranted)].filter((stat) => stat.value > 0)

  return { ...empty, total: aggregate.total, compactTotal: formatCompactCombatValue(aggregate.total), rate: getCombatMetricRate(aggregate.total, scope.engagedMs), secondaryStats, rows }
}

const sumContribution = (sources: Record<string, CombatMetricSourceContribution>, field: 'healthDamage' | 'barrierAbsorbed' | 'overheal') => Object.values(sources).reduce((total, source) => total + source[field], 0)
