import { create } from 'zustand'
import { isBossMonster, MONSTERS } from '../content/monsters'
import { getCombatMetricRate } from '../telemetry/combat/combatTelemetryAggregator'
import { useCombatTelemetryStore } from '../telemetry/combat/combatTelemetryStore'
import type { CombatEvent, CombatEventSink } from '../systems/combat/combatTypes'
import type { DungeonId, MonsterId } from '../types'
import type { CombatMetricSourceContribution } from '../telemetry/combat/combatTelemetryTypes'

export type EncounterRecapSource = Pick<CombatMetricSourceContribution, 'key' | 'actor' | 'kind' | 'sourceId' | 'spellId' | 'actionId' | 'statusId' | 'traitId' | 'total' | 'healthDamage' | 'barrierAbsorbed' | 'effectiveHealing'>

export interface EncounterRecap {
  monsterId: MonsterId
  dungeonId?: DungeonId
  durationMs: number
  dps: number
  dtps: number
  hps: number
  topSources: EncounterRecapSource[]
  defeated: boolean
  boss: boolean
  createdAtMs: number
}

interface CombatRecapState {
  lastEncounterRecap: EncounterRecap | null
  beginRun: () => void
  consumeEvent: (event: CombatEvent) => void
  clear: () => void
}

const initialState = (): Pick<CombatRecapState, 'lastEncounterRecap'> => ({ lastEncounterRecap: null })

const copySource = (source: CombatMetricSourceContribution): EncounterRecapSource => ({
  key: source.key,
  actor: source.actor,
  kind: source.kind,
  sourceId: source.sourceId,
  spellId: source.spellId,
  actionId: source.actionId,
  statusId: source.statusId,
  traitId: source.traitId,
  total: source.total,
  healthDamage: source.healthDamage,
  barrierAbsorbed: source.barrierAbsorbed,
  effectiveHealing: source.effectiveHealing,
})

export const useCombatRecapStore = create<CombatRecapState>((set) => ({
  ...initialState(),
  beginRun: () => set(initialState()),
  consumeEvent: (event) => {
    if (event.sourceId !== 'enemy-defeated' || !event.targetMonsterId) return
    const scope = useCombatTelemetryStore.getState().encounter
    if (!scope || scope.monsterId !== event.targetMonsterId) return
    const damageSources = Object.values(scope.player.damageDone.bySource).sort((left, right) => right.total - left.total || left.key.localeCompare(right.key)).slice(0, 5).map(copySource)
    set({ lastEncounterRecap: {
      monsterId: event.targetMonsterId,
      dungeonId: scope.dungeonId,
      durationMs: scope.elapsedMs,
      dps: getCombatMetricRate(scope.player.damageDone.total, scope.engagedMs),
      dtps: getCombatMetricRate(scope.player.damageTaken.total, scope.engagedMs),
      hps: getCombatMetricRate(scope.player.healingDone.total, scope.engagedMs),
      topSources: damageSources,
      defeated: true,
      boss: Boolean(event.targetMonsterId && isBossMonster(MONSTERS[event.targetMonsterId])),
      createdAtMs: Date.now(),
    } })
  },
  clear: () => set(initialState()),
}))

export const combatRecapSink: CombatEventSink = { push: (event) => useCombatRecapStore.getState().consumeEvent(event) }
export const clearCombatRecap = () => useCombatRecapStore.getState().clear()
export const beginCombatRecapRun = () => useCombatRecapStore.getState().beginRun()
