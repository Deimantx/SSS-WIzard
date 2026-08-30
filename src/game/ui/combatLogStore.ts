import { create } from 'zustand'
import type { CombatEvent, CombatEventSink, CombatLogEntry } from '../systems/combat/combatTypes'

export const MAX_COMBAT_LOG_ENTRIES = 50
let nextSequence = 0

interface CombatLogUiState {
  entries: CombatLogEntry[]
  push: (event: CombatEvent) => void
  clear: () => void
}

export const useCombatLogStore = create<CombatLogUiState>((set) => ({
  entries: [],
  push: (event) => set((state) => {
    const sequence = ++nextSequence
    const entry: CombatLogEntry = { ...event, id: sequence, sequence, timestampMs: event.timestampMs ?? Date.now() }
    return { entries: [entry, ...state.entries].slice(0, MAX_COMBAT_LOG_ENTRIES) }
  }),
  clear: () => set({ entries: [] }),
}))

export const combatLogUiSink: CombatEventSink = {
  push: (event) => useCombatLogStore.getState().push(event),
}

export const clearCombatLogUi = () => useCombatLogStore.getState().clear()
