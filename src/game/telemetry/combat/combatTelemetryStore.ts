import { create } from 'zustand'
import type { CombatEvent, CombatEventSink } from '../../systems/combat/combatTypes'
import { advanceCombatTelemetryScope, cloneCombatTelemetryScope, consumeCombatEvent, createCombatTelemetryScope, reconcileCombatBarrierTelemetry } from './combatTelemetryAggregator'
import type { CombatTelemetryObserver, CombatTelemetryState } from './combatTelemetryTypes'
import type { DungeonId, GameState, MonsterId } from '../../types'

interface CombatTelemetryStore extends CombatTelemetryState {
  beginRun: (dungeonId: DungeonId) => void
  endRun: (reason: 'leave' | 'defeat' | 'reset') => void
  beginEncounter: (monsterId: MonsterId) => void
  endEncounter: (reason: 'death' | 'despawn' | 'leave') => void
  resetMeasurement: () => void
  advanceTime: (deltaMs: number, state: GameState) => void
  consumeEvent: (event: CombatEvent) => void
  clear: () => void
}

const initialState = (): CombatTelemetryState => ({ run: null, lastRun: null, encounter: null })
let nextScopeSequence = 0

const scopeSequence = () => { nextScopeSequence += 1; return nextScopeSequence }
const newScope = (scopeId: string, dungeonId?: DungeonId, monsterId?: MonsterId) => { const sequence = scopeSequence(); return createCombatTelemetryScope(`${scopeId}-${sequence}`, sequence, dungeonId, monsterId) }

export const useCombatTelemetryStore = create<CombatTelemetryStore>((set) => ({
  ...initialState(),
  beginRun: (dungeonId) => set((state) => ({ run: newScope('run', dungeonId), lastRun: state.run ? cloneCombatTelemetryScope(state.run) : state.lastRun, encounter: null })),
  endRun: (_reason) => set((state) => ({ run: null, encounter: null, lastRun: state.run ? { ...cloneCombatTelemetryScope(state.run), scopeId: `last-${state.run.scopeId}` } : state.lastRun })),
  beginEncounter: (monsterId) => set((state) => ({ encounter: newScope('encounter', state.run?.dungeonId, monsterId) })),
  endEncounter: (_reason) => set({ encounter: null }),
  resetMeasurement: () => set((state) => ({
    run: state.run ? newScope('run', state.run.dungeonId) : null,
    encounter: state.encounter ? newScope('encounter', state.encounter.dungeonId ?? state.run?.dungeonId, state.encounter.monsterId) : null,
    lastRun: null,
  })),
  advanceTime: (deltaMs, gameState) => set((state) => {
    let run = state.run
    let encounter = state.encounter
    if (!run && gameState.combat.active) run = newScope('run', gameState.combat.dungeonId ?? undefined)
    if (gameState.combat.active && gameState.combat.enemyId && (!encounter || encounter.monsterId !== gameState.combat.enemyId)) encounter = newScope('encounter', run?.dungeonId ?? gameState.combat.dungeonId ?? undefined, gameState.combat.enemyId)
    if (!run && !encounter) return state
    if (run) {
      run = cloneCombatTelemetryScope(run)
      advanceCombatTelemetryScope(run, deltaMs, gameState.combat.active && Boolean(gameState.combat.enemyId))
      reconcileCombatBarrierTelemetry(run, gameState)
    }
    if (encounter && gameState.combat.active && gameState.combat.enemyId === encounter.monsterId) {
      encounter = cloneCombatTelemetryScope(encounter)
      advanceCombatTelemetryScope(encounter, deltaMs, true)
      reconcileCombatBarrierTelemetry(encounter, gameState)
    }
    return { ...state, run, encounter }
  }),
  consumeEvent: (event) => set((state) => {
    let run = state.run
    let encounter = state.encounter
    if (!run && event.dungeonId) run = newScope('run', event.dungeonId)
    if (event.sourceId === 'encounter-start' && event.targetMonsterId) {
      if (!run && event.dungeonId) run = newScope('run', event.dungeonId)
      encounter = newScope('encounter', run?.dungeonId ?? event.dungeonId, event.targetMonsterId)
    }
    const eventMonsterId = event.source.kind === 'enemy' ? event.source.monsterId : event.targetMonsterId
    const contributes = event.category === 'damage' || event.category === 'basic-attack' || event.category === 'spell' || event.category === 'enemy-action' || event.category === 'trait' || event.category === 'heal' || event.category === 'barrier'
    if (run && contributes) {
      run = cloneCombatTelemetryScope(run)
      consumeCombatEvent(run, event)
      if (eventMonsterId && (!encounter || encounter.monsterId !== eventMonsterId)) encounter = newScope('encounter', run.dungeonId ?? event.dungeonId, eventMonsterId)
    }
    if (encounter && contributes) {
      encounter = cloneCombatTelemetryScope(encounter)
      consumeCombatEvent(encounter, event)
    }
    if (event.sourceId === 'enemy-defeated') encounter = null
    if (event.sourceId === 'player-defeated') { if (run) return { ...state, run: null, encounter: null, lastRun: { ...cloneCombatTelemetryScope(run), scopeId: `last-${run.scopeId}` } }; return { ...state, encounter: null } }
    return { ...state, run, encounter }
  }),
  clear: () => { nextScopeSequence = 0; set(initialState()) },
}))

export const combatTelemetryObserver: CombatTelemetryObserver = {
  beginRun: (dungeonId) => useCombatTelemetryStore.getState().beginRun(dungeonId),
  endRun: (reason) => useCombatTelemetryStore.getState().endRun(reason),
  beginEncounter: (monsterId) => useCombatTelemetryStore.getState().beginEncounter(monsterId),
  endEncounter: (reason) => useCombatTelemetryStore.getState().endEncounter(reason),
  resetMeasurement: () => useCombatTelemetryStore.getState().resetMeasurement(),
  advance: (deltaMs, state) => useCombatTelemetryStore.getState().advanceTime(deltaMs, state),
  consume: (event) => useCombatTelemetryStore.getState().consumeEvent(event),
  clear: () => useCombatTelemetryStore.getState().clear(),
}

export const combatTelemetrySink: CombatEventSink = {
  push: (event) => combatTelemetryObserver.consume(event),
}
