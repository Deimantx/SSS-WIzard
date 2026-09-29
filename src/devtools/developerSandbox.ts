import { useMemo } from 'react'
import { recalculateDerivedStats } from '../game/engine'
import type { GameState } from '../game/types'
import type { GameStore } from '../store/gameStore'
import { useGameStore } from '../store/gameStore'
import { createInitialState } from '../store/initialState'
import { clearDeveloperSandbox, getDeveloperToolsState, setDeveloperSandbox } from './developerToolsStore'

let snapshot: GameState | null = null
const safeDeveloperActions = new Set(['setScreen', 'saveGame', 'reloadFromStorage', 'resetSave', 'hydrateState'])
const wrappedValues = new WeakMap<object, object>()
const wrappedActions = new WeakMap<Function, Function>()

const cloneGameData = (source: Pick<GameStore, keyof GameState>): GameState => {
  const keys = Object.keys(createInitialState()) as (keyof GameState)[]
  return structuredClone(Object.fromEntries(keys.map((key) => [key, source[key]]))) as unknown as GameState
}

export const hasDeveloperSandboxSnapshot = () => snapshot !== null

export const ensureDeveloperSandbox = (reason: string) => {
  const current = getDeveloperToolsState().sandbox
  if (current.active) return false
  snapshot = cloneGameData(useGameStore.getState())
  setDeveloperSandbox({ active: true, reason, snapshotPresent: true, startedAt: Date.now() })
  return true
}

export const runDeveloperMutation = <T,>(reason: string, mutation: () => T): T => {
  ensureDeveloperSandbox(reason)
  return mutation()
}

export const restoreAndExitDeveloperSandbox = () => {
  if (!snapshot) return false
  const restored = cloneGameData(snapshot as GameStore)
  recalculateDerivedStats(restored)
  useGameStore.setState(restored)
  snapshot = null
  clearDeveloperSandbox()
  return true
}

export const discardDeveloperSandboxSnapshot = () => {
  if (!snapshot || getDeveloperToolsState().sandbox.active) return false
  snapshot = null
  setDeveloperSandbox({ active: false, reason: null, snapshotPresent: false, startedAt: null })
  return true
}

const wrapAction = (name: string, action: Function) => {
  if (safeDeveloperActions.has(name)) return action
  const existing = wrappedActions.get(action)
  if (existing) return existing
  const wrapped = (...args: unknown[]) => runDeveloperMutation(`Developer Tools · ${name}`, () => action(...args))
  wrappedActions.set(action, wrapped)
  return wrapped
}

const wrapDeveloperValue = <T,>(value: T): T => {
  if (typeof value === 'function') return wrapAction(value.name || 'gameplay action', value) as T
  if (typeof value !== 'object' || value === null) return value
  if (Array.isArray(value)) return value
  const objectValue = value as object
  const existing = wrappedValues.get(objectValue)
  if (existing) return existing as T
  // Zustand freezes state objects in development. A Proxy over those frozen
  // objects cannot legally substitute wrapped functions for non-configurable
  // action properties, so expose a shallow action facade instead.
  const facade: Record<PropertyKey, unknown> = {}
  wrappedValues.set(objectValue, facade)
  for (const key of Reflect.ownKeys(objectValue)) {
    const member = Reflect.get(objectValue, key)
    facade[key] = typeof member === 'function' && typeof key === 'string' ? wrapAction(key, member) : member
  }
  return facade as T
}

function useDeveloperGameStoreHook<T = GameStore>(selector: (state: GameStore) => T = ((state) => state as T)) {
  const selected = useGameStore(selector)
  return useMemo(() => wrapDeveloperValue(selected), [selected])
}

export const useDeveloperGameStore = Object.assign(useDeveloperGameStoreHook, {
  getState: () => wrapDeveloperValue(useGameStore.getState()),
  setState: (partial: Parameters<typeof useGameStore.setState>[0], replace?: boolean) => runDeveloperMutation('Developer Tools · replace runtime state', () => useGameStore.setState(partial as never, replace as never)),
})
