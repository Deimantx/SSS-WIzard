import { create } from 'zustand'
import { useCombatLogStore } from './combatLogStore'
import { useCombatTelemetryStore } from '../telemetry/combat/combatTelemetryStore'
import type { CombatEvent, CombatEventSink, CombatLogEntry } from '../systems/combat/combatTypes'
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

interface CombatDefeatState {
  snapshot: CombatDefeatSnapshot | null
  consumeEvent: (event: CombatEvent) => void
  clear: () => void
}

const initialState = (): Pick<CombatDefeatState, 'snapshot'> => ({ snapshot: null })

const fallbackEntry = (event: CombatEvent, timestampMs: number): CombatLogEntry => ({ ...event, id: 0, sequence: 0, timestampMs })

export const useCombatDefeatStore = create<CombatDefeatState>((set) => ({
  ...initialState(),
  consumeEvent: (event) => {
    if (event.sourceId !== 'player-defeated') return
    const telemetry = useCombatTelemetryStore.getState()
    const encounter = telemetry.encounter
    const logEntries = useCombatLogStore.getState().entries
    const timestampMs = event.timestampMs ?? logEntries[0]?.timestampMs ?? Date.now()
    const deathEntry = logEntries.find((entry) => entry.sourceId === 'player-defeated') ?? fallbackEntry(event, timestampMs)
    const events = (logEntries.some((entry) => entry.sourceId === 'player-defeated') ? logEntries : [deathEntry, ...logEntries]).slice(0, 10).map((entry) => ({ ...entry })).reverse()
    set({ snapshot: {
      dungeonId: event.dungeonId ?? encounter?.dungeonId ?? telemetry.run?.dungeonId ?? null,
      enemyId: event.targetMonsterId ?? encounter?.monsterId ?? null,
      defeatedAtMs: timestampMs,
      encounterDurationMs: encounter?.elapsedMs,
      damageDone: encounter?.player.damageDone.total,
      damageTaken: encounter?.player.damageTaken.total,
      healing: encounter?.player.healingDone.total,
      events,
    } })
  },
  clear: () => set(initialState()),
}))

export const combatDefeatSink: CombatEventSink = { push: (event) => useCombatDefeatStore.getState().consumeEvent(event) }
export const clearCombatDefeat = () => useCombatDefeatStore.getState().clear()
