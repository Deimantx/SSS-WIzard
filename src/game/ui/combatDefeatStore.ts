import { create } from 'zustand'
import { useCombatLogStore } from './combatLogStore'
import { useCombatTelemetryStore } from '../telemetry/combat/combatTelemetryStore'
import type { CombatEvent, CombatEventSink, CombatLogEntry } from '../systems/combat/combatTypes'
import type { OfflineCombatDefeatResult } from '../systems/offline-bank/offlineCombatTrace'
import type { CombatTelemetryScope } from '../telemetry/combat/combatTelemetryTypes'
import type { DungeonId, MonsterId } from '../types'

export interface CombatDefeatSnapshot {
  dungeonId: DungeonId | null
  enemyId: MonsterId | null
  defeatedAtMs: number
  encounterDurationMs?: number
  damageDone?: number
  damageTaken?: number
  healing?: number
  events: CombatLogEntry[]
}

interface CombatDefeatSnapshotInput {
  event: CombatEvent
  recentEvents: readonly CombatEvent[]
  telemetry?: CombatTelemetryScope | null
  dungeonId?: DungeonId | null
  enemyId?: MonsterId | null
  encounterDurationMs?: number
  damageDone?: number
  damageTaken?: number
  healing?: number
  timestampMs?: number
}

const initialState = (): Pick<CombatDefeatState, 'snapshot'> => ({ snapshot: null })

const finiteOrUndefined = (value: number | undefined) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : undefined

export const buildCombatDefeatSnapshot = ({ event, recentEvents, telemetry, dungeonId, enemyId, encounterDurationMs, damageDone, damageTaken, healing, timestampMs }: CombatDefeatSnapshotInput): CombatDefeatSnapshot => {
  const fallbackTimestamp = timestampMs ?? event.timestampMs ?? recentEvents.find((entry) => entry.timestampMs !== undefined)?.timestampMs ?? Date.now()
  const newestEvents = recentEvents.filter((entry) => entry.actionPhase !== 'start')
  const withDeath = newestEvents.some((entry) => entry.sourceId === 'player-defeated') ? newestEvents : [event, ...newestEvents]
  const events = withDeath.slice(0, 10).map((entry, index) => {
    const stored = entry as CombatLogEntry
    return {
      ...entry,
      id: typeof stored.id === 'number' ? stored.id : index + 1,
      sequence: typeof stored.sequence === 'number' ? stored.sequence : index + 1,
      timestampMs: entry.timestampMs ?? fallbackTimestamp,
    }
  }).reverse()
  return {
    dungeonId: dungeonId ?? event.dungeonId ?? telemetry?.dungeonId ?? null,
    enemyId: enemyId ?? event.targetMonsterId ?? telemetry?.monsterId ?? null,
    defeatedAtMs: event.timestampMs ?? fallbackTimestamp,
    encounterDurationMs: finiteOrUndefined(encounterDurationMs ?? telemetry?.elapsedMs),
    damageDone: finiteOrUndefined(damageDone ?? telemetry?.player.damageDone.total),
    damageTaken: finiteOrUndefined(damageTaken ?? telemetry?.player.damageTaken.total),
    healing: finiteOrUndefined(healing ?? telemetry?.player.healingDone.total),
    events,
  }
}

interface CombatDefeatState {
  snapshot: CombatDefeatSnapshot | null
  consumeEvent: (event: CombatEvent) => void
  clear: () => void
}

export const useCombatDefeatStore = create<CombatDefeatState>((set) => ({
  ...initialState(),
  consumeEvent: (event) => {
    if (event.sourceId !== 'player-defeated') return
    const telemetry = useCombatTelemetryStore.getState()
    const encounter = telemetry.encounter
    const logEntries = useCombatLogStore.getState().entries
    const timestampMs = event.timestampMs ?? logEntries[0]?.timestampMs ?? Date.now()
    set({ snapshot: buildCombatDefeatSnapshot({ event, recentEvents: logEntries, telemetry: encounter, timestampMs }) })
  },
  clear: () => set(initialState()),
}))

export const publishOfflineCombatDefeat = (defeat: OfflineCombatDefeatResult) => {
  const snapshot = buildCombatDefeatSnapshot({
    event: defeat.event,
    recentEvents: defeat.recentEvents,
    dungeonId: defeat.dungeonId,
    enemyId: defeat.enemyId,
    encounterDurationMs: defeat.encounterDurationMs,
    damageDone: defeat.damageDone,
    damageTaken: defeat.damageTaken,
    healing: defeat.healing,
  })
  useCombatDefeatStore.setState({ snapshot })
}

export const combatDefeatSink: CombatEventSink = { push: (event) => useCombatDefeatStore.getState().consumeEvent(event) }
export const clearCombatDefeat = () => useCombatDefeatStore.getState().clear()
