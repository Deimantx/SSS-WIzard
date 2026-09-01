import type { DungeonId, GameState, MonsterId, SpellId } from '../../types'
import type { CombatEvent, CombatSource, DamageType, StatusId, TraitId } from '../../systems/combat/combatTypes'

export type CombatMetricSourceKind = 'basic-attack' | 'spell' | 'action' | 'status' | 'trait' | 'system'

export interface CombatMetricSourceContribution {
  key: string
  actor: 'player' | 'enemy'
  kind: CombatMetricSourceKind
  monsterId?: MonsterId
  spellId?: SpellId
  actionId?: string
  statusId?: StatusId
  traitId?: TraitId
  sourceId?: string
  originSourceId?: string
  originSourceKind?: CombatSource['kind']
  ruleId?: string
  total: number
  healthDamage: number
  barrierAbsorbed: number
  effectiveHealing: number
  overheal: number
  barrierGranted: number
  events: number
  damageTypes: Partial<Record<DamageType, number>>
}

export interface CombatMetricAggregate {
  total: number
  bySource: Record<string, CombatMetricSourceContribution>
}

export interface CombatDamageTakenAggregate extends CombatMetricAggregate {
  healthDamage: number
  barrierAbsorbed: number
}

export interface CombatActorMetrics {
  damageDone: CombatMetricAggregate
  healingDone: CombatMetricAggregate
  damageTaken: CombatDamageTakenAggregate
  barrierGranted: number
  barrierAbsorbed: number
  barrierGrantedBySource: Record<string, CombatMetricSourceContribution>
}

export interface CombatBarrierTelemetryLayer {
  id: string
  owner: 'player' | 'enemy'
  sourceKey?: string
  sourceMetadata?: CombatTelemetrySourceMetadata
  granted: number
  remaining: number
  createdSequence: number
}

export interface CombatTelemetryScope {
  scopeId: string
  dungeonId?: DungeonId
  monsterId?: MonsterId
  startedAtSequence: number
  engagedMs: number
  elapsedMs: number
  player: CombatActorMetrics
  enemy: CombatActorMetrics
  barrierLayers: CombatBarrierTelemetryLayer[]
}

export interface CombatTelemetryState {
  run: CombatTelemetryScope | null
  lastRun: CombatTelemetryScope | null
  encounter: CombatTelemetryScope | null
}

export type CombatTelemetryEndReason = 'leave' | 'defeat' | 'reset'
export type CombatEncounterEndReason = 'death' | 'despawn' | 'leave'

export interface CombatTelemetryObserver {
  beginRun: (dungeonId: DungeonId) => void
  endRun: (reason: CombatTelemetryEndReason) => void
  beginEncounter: (monsterId: MonsterId) => void
  endEncounter: (reason: CombatEncounterEndReason) => void
  resetMeasurement: () => void
  advance: (deltaMs: number, state: GameState) => void
  consume: (event: CombatEvent) => void
  clear: () => void
}

export type CombatTelemetryMetric = 'damage' | 'healing' | 'taken'
export type CombatTelemetryActor = 'player' | 'enemy'

export interface CombatMetricBreakdownRow {
  contribution: CombatMetricSourceContribution
  percent: number
  rate: number
}

export interface CombatMetricSnapshot {
  total: number
  rate: number
  engagedMs: number
  rows: CombatMetricBreakdownRow[]
  otherSources: number
  healthDamage: number
  barrierAbsorbed: number
  overheal: number
  barrierGranted: number
}

export type CombatTelemetrySourceMetadata = Pick<CombatMetricSourceContribution, 'actor' | 'kind' | 'monsterId' | 'spellId' | 'actionId' | 'statusId' | 'traitId' | 'sourceId' | 'originSourceId' | 'originSourceKind' | 'ruleId'>

export const combatActorForSource = (source: CombatEvent['source']): Exclude<CombatSource['actor'], 'system'> | null => source.kind === 'player' ? 'player' : source.kind === 'enemy' ? 'enemy' : null
