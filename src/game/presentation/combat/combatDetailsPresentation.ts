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
  'damage-done': { label: 'DAMAGE DONE', metric: 'damage', totalLabel: 'DAMAGE', rateLabel: 'DPS', colorToken: '--details-damage-done' },
  'damage-taken': { label: 'DAMAGE TAKEN', metric: 'taken', totalLabel: 'DAMAGE', rateLabel: 'DTPS', colorToken: '--details-damage-taken' },
  healing: { label: 'HEALING', metric: 'healing', totalLabel: 'HEALING', rateLabel: 'HPS', colorToken: '--details-healing' },
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
  total: number
  compactTotal: string
  rate: number
  engagedMs: number
  elapsedMs: number
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

export const getCombatDetailsPresentation = (scope: CombatTelemetryScope | null, mode: CombatDetailsMode): CombatDetailsPresentation => {
  const config = COMBAT_DETAILS_MODE_CONFIG[mode]
  const empty: CombatDetailsPresentation = { mode, config, total: 0, compactTotal: '0', rate: 0, engagedMs: scope?.engagedMs ?? 0, elapsedMs: scope?.elapsedMs ?? 0, rows: [] }
  if (!scope) return empty

  const aggregate = getCombatMetricAggregate(scope, 'player', config.metric)
  const rows = Object.values(aggregate.bySource)
    .filter((contribution) => contribution.total > 0)
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

  return { ...empty, total: aggregate.total, compactTotal: formatCompactCombatValue(aggregate.total), rate: getCombatMetricRate(aggregate.total, scope.engagedMs), rows }
}
