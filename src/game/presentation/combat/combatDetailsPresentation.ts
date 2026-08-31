import { getCombatMetricAggregate, getCombatMetricRate } from '../../telemetry/combat/combatTelemetryAggregator'
import { presentCombatMetricSource, type CombatMetricSourcePresentation } from '../../telemetry/combat/combatMetricSourcePresentation'
import type { CombatMetricSourceContribution, CombatTelemetryMetric, CombatTelemetryScope } from '../../telemetry/combat/combatTelemetryTypes'
import { formatUiCombatRate, formatUiCount, formatUiDuration, formatUiPercent } from '../numbers'

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
  totalLabel: string
  percent: number
  percentLabel: string
  rate: number
  rateLabel: string
}

export interface CombatDetailsPresentation {
  mode: CombatDetailsMode
  config: CombatDetailsModeConfig
  total: number
  totalLabel: string
  rate: number
  rateLabel: string
  engagedMs: number
  engagedLabel: string
  elapsedMs: number
  rows: CombatDetailsRowPresentation[]
}

export const cycleCombatDetailsMode = (mode: CombatDetailsMode, direction: -1 | 1): CombatDetailsMode => {
  const index = COMBAT_DETAILS_MODE_ORDER.indexOf(mode)
  const safeIndex = index < 0 ? 0 : index
  return COMBAT_DETAILS_MODE_ORDER[(safeIndex + direction + COMBAT_DETAILS_MODE_ORDER.length) % COMBAT_DETAILS_MODE_ORDER.length]
}

export const getCombatDetailsPresentation = (scope: CombatTelemetryScope | null, mode: CombatDetailsMode): CombatDetailsPresentation => {
  const config = COMBAT_DETAILS_MODE_CONFIG[mode]
  const engagedMs = scope?.engagedMs ?? 0
  const empty: CombatDetailsPresentation = { mode, config, total: 0, totalLabel: '0', rate: 0, rateLabel: '0', engagedMs, engagedLabel: formatUiDuration(engagedMs / 1000), elapsedMs: scope?.elapsedMs ?? 0, rows: [] }
  if (!scope) return empty

  const aggregate = getCombatMetricAggregate(scope, 'player', config.metric)
  const rows = Object.values(aggregate.bySource)
    .filter((contribution) => contribution.total > 0)
    .sort((left, right) => right.total - left.total || left.key.localeCompare(right.key))
    .map((contribution, index) => {
      const percent = aggregate.total > 0 ? contribution.total / aggregate.total * 100 : 0
      const rate = getCombatMetricRate(contribution.total, engagedMs)
      return {
        key: contribution.key,
        rank: index + 1,
        source: presentCombatMetricSource(contribution),
        contribution,
        total: contribution.total,
        totalLabel: formatUiCount(contribution.total),
        percent,
        percentLabel: formatUiPercent(percent),
        rate,
        rateLabel: formatUiCombatRate(rate),
      }
    })

  const rate = getCombatMetricRate(aggregate.total, engagedMs)
  return { ...empty, total: aggregate.total, totalLabel: formatUiCount(aggregate.total), rate, rateLabel: formatUiCombatRate(rate), rows }
}
