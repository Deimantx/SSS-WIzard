import type { CombatEvent, CombatEventSink } from './combatTypes'

/**
 * Fans one resolved combat event out to independent read-only observers.
 * A reporting failure is deliberately isolated so it can never affect combat.
 */
export const createCombatEventSink = (...sinks: Array<CombatEventSink | undefined>): CombatEventSink => ({
  push: (event: CombatEvent) => {
    sinks.forEach((sink) => {
      if (!sink) return
      try {
        sink.push(event)
      } catch {
        // Observation must never change the result of a gameplay resolution.
      }
    })
  },
})
