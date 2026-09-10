import { useSyncExternalStore } from 'react'

export interface CombatRenderIsolationState {
  renderCombatAnalytics: boolean
  renderCombatDetails: boolean
}

const defaultState: CombatRenderIsolationState = {
  renderCombatAnalytics: true,
  renderCombatDetails: true,
}

let currentState = defaultState
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const notify = () => listeners.forEach((listener) => listener())

export const setCombatRenderIsolation = (patch: Partial<CombatRenderIsolationState>) => {
  currentState = { ...currentState, ...patch }
  notify()
}

export const resetCombatRenderIsolation = () => {
  currentState = defaultState
  notify()
}

export const useCombatRenderIsolation = () => useSyncExternalStore(subscribe, () => currentState, () => defaultState)
