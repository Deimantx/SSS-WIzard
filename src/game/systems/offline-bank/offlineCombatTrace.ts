import type { CombatEvent, CombatEventSink } from '../combat/combatTypes'
import type { CombatTelemetryScope } from '../../telemetry/combat/combatTelemetryTypes'
import type { DungeonId, MonsterId } from '../../types'

export const MAX_OFFLINE_COMBAT_TRACE_EVENTS = 20

export interface OfflineCombatDefeatResult {
  event: CombatEvent
  /** Newest event first while the trace is collecting. */
  recentEvents: CombatEvent[]
  dungeonId: DungeonId | null
  enemyId: MonsterId | null
  encounterDurationMs?: number
  damageDone?: number
  damageTaken?: number
  healing?: number
}

const finitePositive = (value: number | undefined) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : undefined
const eventAmount = (event: CombatEvent) => event.healthDamage ?? event.effectiveAmount ?? event.amount ?? 0

const metricFromEvents = (events: readonly CombatEvent[], predicate: (event: CombatEvent) => boolean) => {
  const total = events.reduce((sum, event) => sum + (predicate(event) ? Math.max(0, eventAmount(event)) : 0), 0)
  return total > 0 ? total : undefined
}

export const createOfflineCombatTrace = () => {
  const recentEvents: CombatEvent[] = []
  let defeat: OfflineCombatDefeatResult | null = null

  const push = (event: CombatEvent) => {
    if (event.actionPhase === 'start') return
    recentEvents.unshift({ ...event })
    if (recentEvents.length > MAX_OFFLINE_COMBAT_TRACE_EVENTS) recentEvents.length = MAX_OFFLINE_COMBAT_TRACE_EVENTS
  }

  const captureDefeat = (event: CombatEvent, telemetry?: CombatTelemetryScope | null) => {
    if (defeat) return
    defeat = {
      event: { ...event },
      recentEvents: [],
      dungeonId: event.dungeonId ?? telemetry?.dungeonId ?? null,
      enemyId: event.targetMonsterId ?? telemetry?.monsterId ?? null,
      encounterDurationMs: finitePositive(telemetry?.elapsedMs),
      damageDone: finitePositive(telemetry?.player.damageDone.total),
      damageTaken: finitePositive(telemetry?.player.damageTaken.total),
      healing: finitePositive(telemetry?.player.healingDone.total),
    }
  }

  const getDefeat = (): OfflineCombatDefeatResult | undefined => {
    if (!defeat) return undefined
    const events = recentEvents.some((event) => event.sourceId === 'player-defeated')
      ? recentEvents
      : [defeat.event, ...recentEvents]
    const contextEvents = events.slice(0, MAX_OFFLINE_COMBAT_TRACE_EVENTS).map((event) => ({ ...event }))
    return {
      ...defeat,
      event: { ...defeat.event },
      recentEvents: contextEvents,
      damageDone: defeat.damageDone ?? metricFromEvents(contextEvents, (event) => event.source.kind === 'player' && event.target === 'enemy'),
      damageTaken: defeat.damageTaken ?? metricFromEvents(contextEvents, (event) => event.target === 'player'),
      healing: defeat.healing ?? metricFromEvents(contextEvents, (event) => event.category === 'heal' && event.source.kind === 'player'),
    }
  }

  const sink: CombatEventSink = { push }
  return { sink, push, captureDefeat, getDefeat }
}
