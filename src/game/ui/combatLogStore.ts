import { create } from 'zustand'
import type { CombatLogEntry, CombatLogEvent, CombatUiEventSink } from '../systems/combat/combatTypes'

const MAX_ENTRIES = 300
let nextSequence = 0

interface CombatLogUiState {
  entries: CombatLogEntry[]
  push: (event: CombatLogEvent) => void
  clear: () => void
}

export const useCombatLogStore = create<CombatLogUiState>((set) => ({
  entries: [],
  push: (event) => set((state) => {
    const sequence = ++nextSequence
    const entry: CombatLogEntry = { ...event, id: sequence, sequence, timestampMs: event.timestampMs ?? Date.now() }
    return { entries: [entry, ...state.entries].slice(0, MAX_ENTRIES) }
  }),
  clear: () => set({ entries: [] }),
}))

export const combatLogUiSink: CombatUiEventSink = {
  push: (event) => useCombatLogStore.getState().push(event),
}

export const clearCombatLogUi = () => useCombatLogStore.getState().clear()
