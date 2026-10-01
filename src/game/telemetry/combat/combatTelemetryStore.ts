import { create } from 'zustand'
import type { CombatEvent, CombatEventSink } from '../../systems/combat/combatTypes'
import { advanceCombatTelemetryScope, cloneCombatTelemetryScope, consumeCombatEvent, createCombatTelemetryScope, hasCombatBarrierTelemetryDrift, reconcileCombatBarrierTelemetry } from './combatTelemetryAggregator'
import type { CombatTelemetryObserver, CombatTelemetryState } from './combatTelemetryTypes'
import type { CombatLocationId, GameState, MonsterId } from '../../types'

interface CombatTelemetryStore extends CombatTelemetryState {
  beginRun: (locationId: CombatLocationId) => void
  endRun: (reason: 'leave' | 'defeat' | 'complete' | 'reset') => void
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
const newScope = (scopeId: string, locationId?: CombatLocationId, monsterId?: MonsterId) => { const sequence = scopeSequence(); return createCombatTelemetryScope(`${scopeId}-${sequence}`, sequence, locationId, monsterId) }

const cloneTelemetryState = (state: CombatTelemetryState): CombatTelemetryState => ({
  run: state.run ? cloneCombatTelemetryScope(state.run) : null,
  lastRun: state.lastRun ? cloneCombatTelemetryScope(state.lastRun) : null,
  encounter: state.encounter ? cloneCombatTelemetryScope(state.encounter) : null,
})

const beginRunState = (state: CombatTelemetryState, locationId: CombatLocationId): CombatTelemetryState => ({ run: newScope('run', locationId), lastRun: state.run ? cloneCombatTelemetryScope(state.run) : state.lastRun, encounter: null })
const endRunState = (state: CombatTelemetryState): CombatTelemetryState => ({ run: null, encounter: null, lastRun: state.run ? { ...cloneCombatTelemetryScope(state.run), scopeId: `last-${state.run.scopeId}` } : state.lastRun })
const beginEncounterState = (state: CombatTelemetryState, monsterId: MonsterId): CombatTelemetryState => ({ ...state, encounter: newScope('encounter', state.run?.locationId, monsterId) })
const endEncounterState = (state: CombatTelemetryState): CombatTelemetryState => ({ ...state, encounter: null })
const resetMeasurementState = (state: CombatTelemetryState): CombatTelemetryState => ({
  run: state.run ? newScope('run', state.run.locationId) : null,
  encounter: state.encounter ? newScope('encounter', state.encounter.locationId ?? state.run?.locationId, state.encounter.monsterId) : null,
  lastRun: null,
})

const advanceTelemetryState = (state: CombatTelemetryState, deltaMs: number, gameState: GameState): CombatTelemetryState => {
  let run = state.run
  let encounter = state.encounter
  if (!run && gameState.combat.active) run = newScope('run', gameState.combat.locationId ?? undefined)
  if (gameState.combat.active && gameState.combat.enemyId && (!encounter || encounter.monsterId !== gameState.combat.enemyId)) encounter = newScope('encounter', run?.locationId ?? gameState.combat.locationId ?? undefined, gameState.combat.enemyId)
  if (!run && !encounter) return state
  if (run) {
    const needsBarrierReconcile = hasCombatBarrierTelemetryDrift(run, gameState)
    run = needsBarrierReconcile ? cloneCombatTelemetryScope(run) : { ...run }
    advanceCombatTelemetryScope(run, deltaMs, gameState.combat.active && Boolean(gameState.combat.enemyId))
    if (needsBarrierReconcile) reconcileCombatBarrierTelemetry(run, gameState)
  }
  if (encounter && gameState.combat.active && gameState.combat.enemyId === encounter.monsterId) {
    const needsBarrierReconcile = hasCombatBarrierTelemetryDrift(encounter, gameState)
    encounter = needsBarrierReconcile ? cloneCombatTelemetryScope(encounter) : { ...encounter }
    advanceCombatTelemetryScope(encounter, deltaMs, true)
    if (needsBarrierReconcile) reconcileCombatBarrierTelemetry(encounter, gameState)
  }
  return { ...state, run, encounter }
}

const consumeTelemetryEventState = (state: CombatTelemetryState, event: CombatEvent): CombatTelemetryState => {
  let run = state.run
  let encounter = state.encounter
  if (!run && event.locationId) run = newScope('run', event.locationId)
  if (event.sourceId === 'encounter-start' && event.targetMonsterId) {
    if (!run && event.locationId) run = newScope('run', event.locationId)
    encounter = newScope('encounter', run?.locationId ?? event.locationId, event.targetMonsterId)
  }
  const eventMonsterId = event.source.kind === 'enemy' ? event.source.monsterId : event.targetMonsterId
  const contributes = event.category === 'damage' || event.category === 'basic-attack' || event.category === 'spell' || event.category === 'enemy-action' || event.category === 'trait' || event.category === 'heal' || event.category === 'barrier'
  if (run && contributes) {
    run = cloneCombatTelemetryScope(run)
    consumeCombatEvent(run, event)
    if (eventMonsterId && (!encounter || encounter.monsterId !== eventMonsterId)) encounter = newScope('encounter', run.locationId ?? event.locationId, eventMonsterId)
  }
  if (encounter && contributes) {
    encounter = cloneCombatTelemetryScope(encounter)
    consumeCombatEvent(encounter, event)
  }
  if (event.sourceId === 'enemy-defeated') encounter = null
  if (event.sourceId === 'player-defeated') {
    if (run) return { ...state, run: null, encounter: null, lastRun: { ...cloneCombatTelemetryScope(run), scopeId: `last-${run.scopeId}` } }
    return { ...state, encounter: null }
  }
  return { ...state, run, encounter }
}

export interface CombatTelemetryAccumulator extends CombatTelemetryObserver {
  getState: () => CombatTelemetryState
}

/** Headless telemetry accumulator used by detached Offline Bank simulation. */
export const createCombatTelemetryAccumulator = (initial: CombatTelemetryState = initialState()): CombatTelemetryAccumulator => {
  let state = cloneTelemetryState(initial)
  return {
    beginRun: (locationId) => { state = beginRunState(state, locationId) },
    endRun: () => { state = endRunState(state) },
    beginEncounter: (monsterId) => { state = beginEncounterState(state, monsterId) },
    endEncounter: () => { state = endEncounterState(state) },
    resetMeasurement: () => { state = resetMeasurementState(state) },
    advance: (deltaMs, gameState) => { state = advanceTelemetryState(state, deltaMs, gameState) },
    consume: (event) => { state = consumeTelemetryEventState(state, event) },
    clear: () => { state = initialState() },
    getState: () => state,
  }
}

export const useCombatTelemetryStore = create<CombatTelemetryStore>((set) => ({
  ...initialState(),
  beginRun: (locationId) => set((state) => beginRunState(state, locationId)),
  endRun: (_reason) => set((state) => endRunState(state)),
  beginEncounter: (monsterId) => set((state) => beginEncounterState(state, monsterId)),
  endEncounter: (_reason) => set((state) => endEncounterState(state)),
  resetMeasurement: () => set((state) => resetMeasurementState(state)),
  advanceTime: (deltaMs, gameState) => set((state) => advanceTelemetryState(state, deltaMs, gameState)),
  consumeEvent: (event) => set((state) => consumeTelemetryEventState(state, event)),
  clear: () => { nextScopeSequence = 0; set(initialState()) },
}))

export const combatTelemetryObserver: CombatTelemetryObserver = {
  beginRun: (locationId) => useCombatTelemetryStore.getState().beginRun(locationId),
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
