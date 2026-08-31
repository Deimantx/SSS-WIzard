import { create } from 'zustand'
import { createCriticalHealthAlert, createCombatAlertSpec, type CombatAlert, type CombatAlertSpec } from '../presentation/combat/combatAlertPresentation'
import type { CombatAlertObserver, CombatEvent, CombatEventSink } from '../systems/combat/combatTypes'
import type { DungeonId, GameState } from '../types'

interface CombatAlertsState {
  alerts: CombatAlert[]
  push: (spec: CombatAlertSpec) => void
  consumeEvent: (event: CombatEvent) => void
  advanceTime: (deltaMs: number, state: GameState) => void
  clear: () => void
}

const priorityRank: Record<CombatAlert['priority'], number> = { critical: 0, important: 1, info: 2 }
let nextAlertId = 0
let clockMs = Date.now()

const withoutExpired = (alerts: CombatAlert[], now: number) => alerts.filter((alert) => alert.expiresAtMs === undefined || alert.expiresAtMs > now)
const sortedVisible = (alerts: CombatAlert[]) => [...alerts].sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority] || right.createdAtMs - left.createdAtMs).slice(0, 3)
const materialize = (spec: CombatAlertSpec, now: number): CombatAlert => ({ ...spec, id: `combat-alert-${++nextAlertId}`, createdAtMs: now, ...(spec.durationMs === undefined ? {} : { expiresAtMs: now + spec.durationMs }) })

export const useCombatAlertsStore = create<CombatAlertsState>((set) => ({
  alerts: [],
  push: (spec) => set((state) => {
    const now = clockMs
    const current = withoutExpired(state.alerts, now)
    const existingIndex = current.findIndex((alert) => alert.dedupeKey === spec.dedupeKey)
    if (existingIndex >= 0) {
      const existing = current[existingIndex]
      const refreshed = { ...existing, detail: spec.detail, title: spec.title, priority: priorityRank[spec.priority] < priorityRank[existing.priority] ? spec.priority : existing.priority, expiresAtMs: spec.durationMs === undefined ? existing.expiresAtMs : Math.max(existing.expiresAtMs ?? 0, now + spec.durationMs) }
      current[existingIndex] = refreshed
      return { alerts: sortedVisible(current) }
    }
    return { alerts: sortedVisible([...current, materialize(spec, now)]) }
  }),
  consumeEvent: (event) => {
    const spec = createCombatAlertSpec(event)
    if (spec) useCombatAlertsStore.getState().push(spec)
  },
  advanceTime: (deltaMs, gameState) => set((state) => {
    clockMs += Math.max(0, deltaMs)
    let alerts = withoutExpired(state.alerts, clockMs)
    const criticalHealth = createCriticalHealthAlert(gameState)
    if (criticalHealth) {
      const existing = alerts.find((alert) => alert.dedupeKey === criticalHealth.dedupeKey)
      if (!existing) alerts = [...alerts, materialize(criticalHealth, clockMs)]
    } else alerts = alerts.filter((alert) => alert.dedupeKey !== 'critical-player-health')
    return { alerts: sortedVisible(alerts) }
  }),
  clear: () => { clockMs = Date.now(); set({ alerts: [] }) },
}))

export const combatAlertsObserver: CombatAlertObserver = {
  beginRun: (_dungeonId: DungeonId) => useCombatAlertsStore.getState().clear(),
  advance: (deltaMs, state) => useCombatAlertsStore.getState().advanceTime(deltaMs, state),
  consume: (event) => useCombatAlertsStore.getState().consumeEvent(event),
  clear: () => useCombatAlertsStore.getState().clear(),
}

export const combatAlertsSink: CombatEventSink = { push: (event) => combatAlertsObserver.consume(event) }
export const clearCombatAlerts = () => useCombatAlertsStore.getState().clear()
