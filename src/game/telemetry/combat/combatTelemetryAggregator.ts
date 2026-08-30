import type { MonsterId } from '../../types'
import type { CombatEvent, CombatSource } from '../../systems/combat/combatTypes'
import type { CombatActorMetrics, CombatMetricAggregate, CombatMetricSourceContribution, CombatTelemetryScope, CombatTelemetrySourceMetadata, CombatTelemetryMetric } from './combatTelemetryTypes'

const finite = (value: number | undefined) => Number.isFinite(value) ? Math.max(0, value as number) : 0

const emptyMetric = (): CombatMetricAggregate => ({ total: 0, bySource: {} })

export const createCombatActorMetrics = (): CombatActorMetrics => ({
  damageDone: emptyMetric(),
  healingDone: emptyMetric(),
  damageTaken: { ...emptyMetric(), healthDamage: 0, barrierAbsorbed: 0 },
  barrierGranted: 0,
  barrierAbsorbed: 0,
  barrierGrantedBySource: {},
})

export const createCombatTelemetryScope = (scopeId: string, startedAtSequence: number, dungeonId?: CombatTelemetryScope['dungeonId'], monsterId?: MonsterId): CombatTelemetryScope => ({
  scopeId,
  dungeonId,
  monsterId,
  startedAtSequence,
  engagedMs: 0,
  elapsedMs: 0,
  player: createCombatActorMetrics(),
  enemy: createCombatActorMetrics(),
})

export const cloneCombatTelemetryScope = (scope: CombatTelemetryScope): CombatTelemetryScope => ({
  ...scope,
  player: cloneActorMetrics(scope.player),
  enemy: cloneActorMetrics(scope.enemy),
})

const cloneContribution = (contribution: CombatMetricSourceContribution): CombatMetricSourceContribution => ({ ...contribution })
const cloneMetric = (metric: CombatMetricAggregate): CombatMetricAggregate => ({ total: metric.total, bySource: Object.fromEntries(Object.entries(metric.bySource).map(([key, contribution]) => [key, cloneContribution(contribution)])) })
const cloneActorMetrics = (metrics: CombatActorMetrics): CombatActorMetrics => ({
  damageDone: cloneMetric(metrics.damageDone),
  healingDone: cloneMetric(metrics.healingDone),
  damageTaken: { ...cloneMetric(metrics.damageTaken), healthDamage: metrics.damageTaken.healthDamage, barrierAbsorbed: metrics.damageTaken.barrierAbsorbed },
  barrierGranted: metrics.barrierGranted,
  barrierAbsorbed: metrics.barrierAbsorbed,
  barrierGrantedBySource: Object.fromEntries(Object.entries(metrics.barrierGrantedBySource).map(([key, contribution]) => [key, cloneContribution(contribution)])),
})

const eventKind = (event: CombatEvent): CombatMetricSourceContribution['kind'] => {
  if (event.sourceKind === 'weapon' || event.sourceKind === 'equipment') return 'basic-attack'
  if (event.sourceKind === 'basic-attack' || event.sourceKind === 'spell' || event.sourceKind === 'action' || event.sourceKind === 'status' || event.sourceKind === 'trait' || event.sourceKind === 'system') return event.sourceKind
  if (event.category === 'spell') return 'spell'
  if (event.category === 'enemy-action') return 'action'
  if (event.category === 'basic-attack') return 'basic-attack'
  if (event.category === 'trait') return 'trait'
  if (event.statusId) return 'status'
  return 'system'
}

const metadataForEvent = (event: CombatEvent): CombatTelemetrySourceMetadata | null => {
  const actor = event.source.kind === 'player' ? 'player' : event.source.kind === 'enemy' ? 'enemy' : null
  if (!actor) return null
  const kind = eventKind(event)
  const monsterId = event.source.kind === 'enemy' ? event.source.monsterId : undefined
  const sourceId = event.sourceId
  return {
    actor,
    kind,
    monsterId,
    spellId: event.spellId,
    actionId: event.actionId ?? (kind === 'action' ? sourceId : undefined),
    statusId: event.statusId ?? (kind === 'status' ? sourceId as CombatTelemetrySourceMetadata['statusId'] : undefined),
    traitId: event.traitId ?? (kind === 'trait' ? sourceId as CombatTelemetrySourceMetadata['traitId'] : undefined),
    sourceId,
    originSourceId: event.originSourceId,
    ruleId: event.ruleId,
  }
}

export const getCombatMetricSourceKey = (event: CombatEvent): string => {
  const metadata = metadataForEvent(event)
  if (!metadata) return 'system:unknown'
  const actorPrefix = metadata.actor === 'enemy' ? `enemy:${metadata.monsterId ?? 'unknown'}` : 'player'
  if (metadata.kind === 'spell') return `spell:${metadata.spellId ?? metadata.sourceId ?? 'unknown'}`
  if (metadata.kind === 'basic-attack') return `${actorPrefix}:basic`
  if (metadata.kind === 'action') return `${actorPrefix}:action:${metadata.actionId ?? metadata.sourceId ?? 'unknown'}`
  if (metadata.kind === 'status') return `status:${metadata.statusId ?? metadata.sourceId ?? 'unknown'}`
  if (metadata.kind === 'trait') return `${actorPrefix}:trait:${metadata.traitId ?? metadata.sourceId ?? 'unknown'}`
  return `system:${metadata.sourceId ?? 'unknown'}`
}

export const getCombatMetricSourceMetadata = (event: CombatEvent): CombatTelemetrySourceMetadata | null => metadataForEvent(event)

const contributionFor = (aggregate: CombatMetricAggregate, event: CombatEvent): CombatMetricSourceContribution | null => {
  const metadata = metadataForEvent(event)
  if (!metadata || metadata.kind === 'system') return null
  const key = getCombatMetricSourceKey(event)
  const existing = aggregate.bySource[key]
  if (existing) return existing
  const contribution: CombatMetricSourceContribution = { key, ...metadata, total: 0, healthDamage: 0, barrierAbsorbed: 0, effectiveHealing: 0, overheal: 0, barrierGranted: 0, events: 0 }
  aggregate.bySource[key] = contribution
  return contribution
}

const metricActor = (scope: CombatTelemetryScope, actor: 'player' | 'enemy') => scope[actor]

export const consumeCombatEvent = (scope: CombatTelemetryScope, event: CombatEvent): void => {
  const sourceActor = event.source.kind === 'player' || event.source.kind === 'enemy' ? event.source.kind : null
  if (!sourceActor) return
  const metadata = metadataForEvent(event)
  if (!metadata || metadata.kind === 'system') return

  if (event.category === 'damage' || event.category === 'basic-attack' || event.category === 'spell' || event.category === 'enemy-action' || event.category === 'trait') {
    const amount = finite(event.amount)
    if (amount <= 0) return
    const sourceMetrics = metricActor(scope, sourceActor)
    const sourceContribution = contributionFor(sourceMetrics.damageDone, event)
    if (sourceContribution) {
      sourceMetrics.damageDone.total += amount
      sourceContribution.total += amount
      sourceContribution.healthDamage += finite(event.healthDamage)
      sourceContribution.barrierAbsorbed += finite(event.barrierAbsorbed)
      sourceContribution.events += 1
    }
    const targetActor = event.target === 'player' || event.target === 'enemy' ? event.target : null
    if (targetActor) {
      const targetMetrics = metricActor(scope, targetActor)
      const targetContribution = contributionFor(targetMetrics.damageTaken, event)
      targetMetrics.damageTaken.total += amount
      targetMetrics.damageTaken.healthDamage += finite(event.healthDamage)
      targetMetrics.damageTaken.barrierAbsorbed += finite(event.barrierAbsorbed)
      targetMetrics.barrierAbsorbed += finite(event.barrierAbsorbed)
      if (targetContribution) {
        targetContribution.total += amount
        targetContribution.healthDamage += finite(event.healthDamage)
        targetContribution.barrierAbsorbed += finite(event.barrierAbsorbed)
        targetContribution.events += 1
      }
    }
    return
  }

  if (event.category === 'heal') {
    const effective = finite(event.effectiveAmount ?? event.amount)
    const attempted = finite(event.attemptedAmount ?? effective)
    const overheal = finite(event.overheal ?? Math.max(0, attempted - effective))
    const metrics = metricActor(scope, sourceActor)
    const contribution = contributionFor(metrics.healingDone, event)
    metrics.healingDone.total += effective
    if (contribution) {
      contribution.total += effective
      contribution.effectiveHealing += effective
      contribution.overheal += overheal
      contribution.events += 1
    }
    return
  }

  if (event.category === 'barrier') {
    const amount = finite(event.amount)
    if (amount <= 0) return
    const metrics = metricActor(scope, sourceActor)
    const key = getCombatMetricSourceKey(event)
    const metadata = metadataForEvent(event)
    if (!metadata) return
    const contribution = metrics.barrierGrantedBySource[key] ?? (metrics.barrierGrantedBySource[key] = { key, ...metadata, total: 0, healthDamage: 0, barrierAbsorbed: 0, effectiveHealing: 0, overheal: 0, barrierGranted: 0, events: 0 })
    metrics.barrierGranted += amount
    contribution.barrierGranted += amount
    contribution.events += 1
  }
}

export const advanceCombatTelemetryScope = (scope: CombatTelemetryScope, deltaMs: number, engaged: boolean): void => {
  const delta = finite(deltaMs)
  scope.elapsedMs += delta
  if (engaged) scope.engagedMs += delta
}

export const getCombatMetricAggregate = (scope: CombatTelemetryScope, actor: 'player' | 'enemy', metric: CombatTelemetryMetric): CombatMetricAggregate => {
  const metrics = scope[actor]
  if (metric === 'damage') return metrics.damageDone
  if (metric === 'healing') return metrics.healingDone
  return metrics.damageTaken
}

export const getCombatMetricTotal = (scope: CombatTelemetryScope, actor: 'player' | 'enemy', metric: CombatTelemetryMetric): number => getCombatMetricAggregate(scope, actor, metric).total

export const getCombatMetricRate = (total: number, engagedMs: number): number => engagedMs > 0 ? total / (engagedMs / 1000) : 0

export const getCombatMetricSourceActor = (event: CombatEvent): CombatSource['actor'] | null => event.source.kind === 'player' || event.source.kind === 'enemy' ? event.source.kind : null
