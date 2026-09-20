import { STATUS_DEFINITIONS } from '../../content/statuses'
import type { ActiveStatus, CombatEffect, DamageType, StatusDefinition, StatusId } from '../../systems/combat/combatTypes'
import { resolveCombatSourceLabel } from './combatSourcePresentation'
import type { GameState } from '../../types'
import { calculateCombatDamage } from '../../systems/combat/effectResolver'
import { buildPeriodicStatusCombatSource, getExecutablePeriodicStatusEffects } from '../../systems/combat/combatProvenance'
import { resolveMagnitude } from '../../systems/combat/magnitude'

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

const sourcePeriodicPresentation = (status: ActiveStatus, definition: StatusDefinition, state?: GameState): PeriodicStatusSourcePresentation => {
  const effects = (state ? getExecutablePeriodicStatusEffects(status) : periodicPayload(status)).filter((effect) => effect.type === 'deal-damage')
  const damageTypes = [...new Set(effects.flatMap((effect) => effect.components.map((component) => component.damageType)))]
  const source = state ? buildPeriodicStatusCombatSource(status) : undefined
  const damagePerTick = effects.reduce((total, effect) => total + effect.components.reduce((componentTotal, component) => {
    if (!state || !source) return componentTotal + (component.magnitude.type === 'flat' ? component.magnitude.value : 0)
    const target = effect.target === 'self' ? source.actor : source.actor === 'player' ? 'enemy' : 'player'
    const tags = [...new Set([...(source.tags ?? []), ...(effect.tags ?? [])])]
    const raw = resolveMagnitude(state, component.magnitude, source, target)
    return componentTotal + calculateCombatDamage(state, raw, component.damageType, source, target, tags).resolvedBeforeBarrier
  }, 0), 0)
  const interval = definition.periodic?.intervalMs ?? 0
  return {
    instanceKey: status.instanceKey,
    sourceLabel: resolveCombatSourceLabel(status.source),
    remainingMs: status.remainingMs,
    tickIntervalMs: interval,
    ...(effects.length && interval > 0 ? { damagePerTick, damagePerSecond: damagePerTick / (interval / 1000), damageType: damageTypes.length === 1 ? damageTypes[0] : undefined } : {}),
  }
}

const buildBasicGroup = (statusId: StatusId, instances: ActiveStatus[]): CombatStatusGroupPresentation | null => {
  const definition = STATUS_DEFINITIONS[statusId]
  if (!definition) return null
  const hasInfinite = instances.some((status) => status.remainingMs === null)
  const displayRemainingMs = hasInfinite ? null : Math.max(...instances.map((status) => status.remainingMs ?? 0))
  const displayInstance = instances.reduce((best, status) => (status.remainingMs === null || (best.remainingMs !== null && (status.remainingMs ?? 0) > (best.remainingMs ?? 0))) ? status : best, instances[0])
  const displayInitialDurationMs = displayInstance.initialDurationMs ?? definition.defaultDurationMs
  const totalStacks = instances.reduce((total, status) => total + Math.max(0, status.stacks), 0)
  const categoryKey = definition.tags.includes('dot') ? 'dot' : definition.tags.includes('control') ? 'control' : definition.classification === 'buff' ? 'buff' : definition.classification === 'debuff' ? 'debuff' : 'neutral'
  const categoryLabel = categoryKey === 'dot' ? 'Damage over time' : categoryKey === 'control' ? 'Control' : categoryKey === 'buff' ? 'Buff' : categoryKey === 'debuff' ? 'Debuff' : 'Status'
  return { statusId, definition, instances, displayRemainingMs, displayInitialDurationMs, totalStacks, categoryKey, categoryLabel, sourceBreakdown: [], }
}

export const getCombatStatusGroupsBasic = (statuses: ActiveStatus[]): CombatStatusGroupPresentation[] => {
  const groups = new Map<StatusId, ActiveStatus[]>()
  statuses.forEach((status) => {
    const group = groups.get(status.statusId) ?? []
    group.push(status)
    groups.set(status.statusId, group)
  })
  return [...groups.entries()].flatMap(([statusId, instances]) => {
    const group = buildBasicGroup(statusId, instances)
    return group ? [group] : []
  })
}

export const getCombatStatusGroupDetails = (group: CombatStatusGroupPresentation, state: GameState): CombatStatusGroupPresentation => {
  if (!group.definition.tags.includes('dot')) return group
  const sourceBreakdown = group.instances.map((status) => sourcePeriodicPresentation(status, group.definition, state)).sort((left, right) => (right.damagePerSecond ?? 0) - (left.damagePerSecond ?? 0) || left.sourceLabel.localeCompare(right.sourceLabel))
  const totalCurrentRate = sourceBreakdown.reduce((total, source) => total + (source.damagePerSecond ?? 0), 0)
  return { ...group, sourceBreakdown, ...(sourceBreakdown.some((source) => source.damagePerSecond !== undefined) ? { totalCurrentRate } : {}) }
}

export const getCombatStatusGroups = (statuses: ActiveStatus[], state?: GameState): CombatStatusGroupPresentation[] => {
  const groups = getCombatStatusGroupsBasic(statuses)
  return state ? groups.map((group) => getCombatStatusGroupDetails(group, state)) : groups
}
