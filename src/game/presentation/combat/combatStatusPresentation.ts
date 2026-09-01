import { STATUS_DEFINITIONS } from '../../content/statuses'
import type { ActiveStatus, CombatEffect, DamageType, StatusDefinition, StatusId } from '../../systems/combat/combatTypes'
import { resolveCombatSourceLabel } from './combatSourcePresentation'

export interface PeriodicStatusSourcePresentation {
  instanceKey: string
  sourceLabel: string
  remainingMs: number | null
  tickIntervalMs: number
  damagePerTick?: number
  damagePerSecond?: number
  damageType?: DamageType
}

export interface CombatStatusGroupPresentation {
  statusId: StatusId
  definition: StatusDefinition
  instances: ActiveStatus[]
  displayRemainingMs: number | null
  displayInitialDurationMs: number | null
  totalStacks: number
  categoryKey: 'dot' | 'control' | 'buff' | 'debuff' | 'neutral'
  categoryLabel: string
  sourceBreakdown: PeriodicStatusSourcePresentation[]
  totalCurrentRate?: number
}

const periodicPayload = (status: ActiveStatus): CombatEffect[] => status.periodicEffects ?? STATUS_DEFINITIONS[status.statusId]?.periodic?.effects ?? []

const sourcePeriodicPresentation = (status: ActiveStatus, definition: StatusDefinition): PeriodicStatusSourcePresentation => {
  const effects = periodicPayload(status).filter((effect) => effect.type === 'deal-damage')
  const flatEffects = effects.filter((effect) => effect.magnitude.type === 'flat')
  const damagePerTick = flatEffects.reduce((total, effect) => total + (effect.magnitude.type === 'flat' ? effect.magnitude.value : 0), 0)
  const damageTypes = [...new Set(flatEffects.map((effect) => effect.damageType))]
  const interval = definition.periodic?.intervalMs ?? 0
  return {
    instanceKey: status.instanceKey,
    sourceLabel: resolveCombatSourceLabel(status.source),
    remainingMs: status.remainingMs,
    tickIntervalMs: interval,
    ...(flatEffects.length && interval > 0 ? { damagePerTick, damagePerSecond: damagePerTick / (interval / 1000), damageType: damageTypes.length === 1 ? damageTypes[0] : undefined } : {}),
  }
}

export const getCombatStatusGroups = (statuses: ActiveStatus[]): CombatStatusGroupPresentation[] => {
  const groups = new Map<StatusId, ActiveStatus[]>()
  statuses.forEach((status) => {
    const group = groups.get(status.statusId) ?? []
    group.push(status)
    groups.set(status.statusId, group)
  })
  return [...groups.entries()].flatMap(([statusId, instances]) => {
    const definition = STATUS_DEFINITIONS[statusId]
    if (!definition) return []
    const hasInfinite = instances.some((status) => status.remainingMs === null)
    const displayRemainingMs = hasInfinite ? null : Math.max(...instances.map((status) => status.remainingMs ?? 0))
    const displayInstance = instances.reduce((best, status) => (status.remainingMs === null || (best.remainingMs !== null && (status.remainingMs ?? 0) > (best.remainingMs ?? 0))) ? status : best, instances[0])
    const displayInitialDurationMs = displayInstance.initialDurationMs ?? definition.defaultDurationMs
    const totalStacks = instances.reduce((total, status) => total + Math.max(0, status.stacks), 0)
    const categoryKey = definition.tags.includes('dot') ? 'dot' : definition.tags.includes('control') ? 'control' : definition.classification === 'buff' ? 'buff' : definition.classification === 'debuff' ? 'debuff' : 'neutral'
    const categoryLabel = categoryKey === 'dot' ? 'Damage over time' : categoryKey === 'control' ? 'Control' : categoryKey === 'buff' ? 'Buff' : categoryKey === 'debuff' ? 'Debuff' : 'Status'
    const sourceBreakdown = definition.tags.includes('dot')
      ? instances.map((status) => sourcePeriodicPresentation(status, definition)).sort((left, right) => (right.damagePerSecond ?? 0) - (left.damagePerSecond ?? 0) || left.sourceLabel.localeCompare(right.sourceLabel))
      : []
    const totalCurrentRate = sourceBreakdown.reduce((total, source) => total + (source.damagePerSecond ?? 0), 0)
    return [{ statusId, definition, instances, displayRemainingMs, displayInitialDurationMs, totalStacks, categoryKey, categoryLabel, sourceBreakdown, ...(sourceBreakdown.some((source) => source.damagePerSecond !== undefined) ? { totalCurrentRate } : {}) }]
  })
}
