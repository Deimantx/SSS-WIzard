import { STATUS_DEFINITIONS } from '../../content/statuses'
import type { ActiveStatus, CombatEffect, CombatSource } from './combatTypes'
import type { CombatActor } from './magnitude'

export interface CombatSourceProvenance {
  sourceId?: string
  sourceKind?: CombatSource['kind']
  tags?: CombatSource['tags']
  school?: CombatSource['school']
  providerInstanceKey?: string
}

/** Returns the authored root behind a direct, status, or chained combat source. */
export const getRootCombatSourceProvenance = (source: CombatSource): CombatSourceProvenance => ({
  sourceId: source.originSourceId ?? source.sourceId,
  sourceKind: source.originSourceKind ?? source.kind,
  tags: source.originTags ?? source.tags,
  school: source.originSchool ?? source.school,
  providerInstanceKey: source.providerInstanceKey,
})

const relativeTargetForHolder = (holder: CombatActor, sourceActor: CombatActor, target: 'self' | 'opponent'): CombatActor => {
  if (target === 'self') return holder
  return holder === 'player' ? 'enemy' : 'player'
}

/** The executable periodic payload with targets translated to its applier. */
export const getExecutablePeriodicStatusEffects = (status: ActiveStatus): CombatEffect[] => {
  const definition = STATUS_DEFINITIONS[status.statusId]
  return (status.periodicEffects ?? definition?.periodic?.effects)?.map((effect) => ({
    ...effect,
    target: relativeTargetForHolder(status.holder, status.source.actor, effect.target) === status.source.actor ? 'self' : 'opponent',
  }) as CombatEffect) ?? []
}

/** Builds the same source identity used by runtime periodic ticks and analytics. */
export const buildPeriodicStatusCombatSource = (status: ActiveStatus): CombatSource => {
  const root = getRootCombatSourceProvenance(status.source)
  const definition = STATUS_DEFINITIONS[status.statusId]
  return {
    ...status.source,
    kind: 'status',
    sourceId: status.statusId,
    statusId: status.statusId,
    statusInstanceKey: status.instanceKey,
    originSourceId: root.sourceId,
    originSourceKind: root.sourceKind,
    originTags: root.tags,
    originSchool: root.school,
    providerInstanceKey: root.providerInstanceKey,
    school: root.school ?? status.source.school,
    tags: ['status', ...(definition?.tags ?? []), ...(root.tags ?? [])],
  }
}
