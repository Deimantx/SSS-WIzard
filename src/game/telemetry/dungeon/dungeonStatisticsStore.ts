import { create } from 'zustand'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import type { CombatEvent, CombatEventSink } from '../../systems/combat/combatTypes'
import type { DungeonId, GameState, ItemId, MonsterId } from '../../types'
import type { DungeonStatisticsObserver, DungeonStatisticsSession, DungeonStatisticsState } from './dungeonStatisticsTypes'

interface CurrentEncounter { monsterId: MonsterId; boss: boolean; elapsedMs: number }
interface DungeonStatisticsStore extends DungeonStatisticsState {
  currentEncounter: CurrentEncounter | null
  beginSession: (dungeonId: DungeonId) => void
  endSession: (reason: 'leave' | 'death' | 'complete' | 'dungeon-change') => void
  advanceTime: (deltaMs: number, state: GameState) => void
  beginRun: () => void
  completeRun: (durationMs: number) => void
  beginEncounter: (monsterId: MonsterId, boss: boolean) => void
  completeEncounter: (monsterId: MonsterId, durationMs: number, boss: boolean) => void
  consumeEvent: (event: CombatEvent) => void
  reset: () => void
  clear: () => void
}

const initialState = (): DungeonStatisticsState & { currentEncounter: CurrentEncounter | null } => ({ session: null, active: false, currentEncounter: null })
const newSession = (dungeonId: DungeonId): DungeonStatisticsSession => ({
  dungeonId,
  startedAtMs: Date.now(),
  elapsedMs: 0,
  engagedMs: 0,
  completedRuns: 0,
  currentRunElapsedMs: 0,
  completedRunDurationTotalMs: 0,
  bestRunMs: null,
  normalEncounterCount: 0,
  normalEncounterDurationTotalMs: 0,
  fastestEncounterMs: null,
  bossEncounterCount: 0,
  bossDurationTotalMs: 0,
  fastestBossMs: null,
  totalLootQuantity: 0,
  lootByItemId: {},
})

const bossFor = (monsterId: MonsterId) => Boolean(MONSTERS[monsterId] && isBossMonster(MONSTERS[monsterId]))
const validDuration = (durationMs: number) => Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0
const addLootToSession = (session: DungeonStatisticsSession, itemId: ItemId, quantity: number): DungeonStatisticsSession => {
  const lootByItemId = { ...session.lootByItemId, [itemId]: (session.lootByItemId[itemId] ?? 0) + quantity }
  const totalLootQuantity = Object.values(lootByItemId).reduce((total, amount) => total + (Number.isFinite(amount) ? Math.max(0, amount ?? 0) : 0), 0)
  return { ...session, totalLootQuantity, lootByItemId }
}

type DungeonStatisticsSnapshot = DungeonStatisticsState & { currentEncounter: CurrentEncounter | null }

const beginEncounterState = (state: DungeonStatisticsSnapshot, monsterId: MonsterId, boss: boolean): DungeonStatisticsSnapshot => ({ ...state, currentEncounter: { monsterId, boss, elapsedMs: 0 } })
const completeEncounterState = (state: DungeonStatisticsSnapshot, monsterId: MonsterId, durationMs: number, boss: boolean): DungeonStatisticsSnapshot => {
  if (!state.active || !state.session) return state
  const encounter = state.currentEncounter
  if (!encounter || encounter.monsterId !== monsterId) return state
  const duration = validDuration(durationMs)
  const session = { ...state.session }
  if (boss) {
    session.bossEncounterCount += 1
    session.bossDurationTotalMs += duration
    session.fastestBossMs = session.fastestBossMs === null ? duration : Math.min(session.fastestBossMs, duration)
  } else {
    session.normalEncounterCount += 1
    session.normalEncounterDurationTotalMs += duration
    session.fastestEncounterMs = session.fastestEncounterMs === null ? duration : Math.min(session.fastestEncounterMs, duration)
  }
  return { ...state, session, currentEncounter: null }
}
const completeRunState = (state: DungeonStatisticsSnapshot, durationMs: number): DungeonStatisticsSnapshot => {
  if (!state.active || !state.session) return state
  const duration = validDuration(durationMs)
  const session = { ...state.session, completedRuns: state.session.completedRuns + 1, completedRunDurationTotalMs: state.session.completedRunDurationTotalMs + duration, currentRunElapsedMs: 0 }
  session.bestRunMs = session.bestRunMs === null ? duration : Math.min(session.bestRunMs, duration)
  return { ...state, session }
}

const cloneStatisticsState = (state: DungeonStatisticsSnapshot): DungeonStatisticsSnapshot => ({
  active: state.active,
  session: state.session ? { ...state.session, lootByItemId: { ...state.session.lootByItemId } } : null,
  currentEncounter: state.currentEncounter ? { ...state.currentEncounter } : null,
})

const beginSessionSnapshot = (state: DungeonStatisticsSnapshot, dungeonId: DungeonId): DungeonStatisticsSnapshot => state.active && state.session?.dungeonId === dungeonId ? state : { session: newSession(dungeonId), active: true, currentEncounter: null }
const endSessionSnapshot = (state: DungeonStatisticsSnapshot): DungeonStatisticsSnapshot => ({ ...state, active: false, currentEncounter: null })
const advanceStatisticsSnapshot = (state: DungeonStatisticsSnapshot, deltaMs: number, gameState: GameState): DungeonStatisticsSnapshot => {
  const delta = validDuration(deltaMs)
  let active = state.active
  let session = state.session
  let currentEncounter = state.currentEncounter
  if (!active && gameState.combat.active && gameState.combat.dungeonId) {
    active = true
    session = newSession(gameState.combat.dungeonId)
    currentEncounter = null
  }
  if (!active || !session || delta <= 0) return state
  const engaged = gameState.combat.active && Boolean(gameState.combat.enemyId)
  session = { ...session, elapsedMs: session.elapsedMs + delta, currentRunElapsedMs: session.currentRunElapsedMs + delta }
  if (engaged) {
    session.engagedMs += delta
    const monsterId = gameState.combat.enemyId as MonsterId
    if (!currentEncounter || currentEncounter.monsterId !== monsterId) currentEncounter = { monsterId, boss: bossFor(monsterId), elapsedMs: 0 }
    currentEncounter = { ...currentEncounter, elapsedMs: currentEncounter.elapsedMs + delta }
  }
  return { ...state, active, session, currentEncounter }
}
const consumeStatisticsEvent = (state: DungeonStatisticsSnapshot, event: CombatEvent): DungeonStatisticsSnapshot => {
  let next = state
  if (!next.active && !next.session && event.dungeonId && event.sourceId === 'encounter-start') next = { ...next, active: true, session: newSession(event.dungeonId) }
  if (!next.active || !next.session) return next
  if (event.sourceId === 'encounter-start' && event.targetMonsterId) return beginEncounterState(next, event.targetMonsterId, bossFor(event.targetMonsterId))
  if (event.category === 'loot' && event.sourceId === 'loot-drop' && event.itemId && Number.isFinite(event.amount) && (event.amount ?? 0) > 0) {
    const quantity = event.amount ?? 0
    return { ...next, session: addLootToSession(next.session, event.itemId, quantity) }
  }
  if (event.sourceId === 'enemy-defeated' && event.targetMonsterId) {
    const boss = bossFor(event.targetMonsterId)
    const durationMs = next.currentEncounter?.monsterId === event.targetMonsterId ? next.currentEncounter.elapsedMs : 0
    next = completeEncounterState(next, event.targetMonsterId, durationMs, boss)
    if (boss) next = completeRunState(next, next.session?.currentRunElapsedMs ?? 0)
    return next
  }
  if (event.sourceId === 'player-defeated') return { ...next, active: false, currentEncounter: null }
  return next
}

export interface DungeonStatisticsAccumulator extends DungeonStatisticsObserver {
  getState: () => DungeonStatisticsSnapshot
}

/** Headless statistics accumulator used by detached Offline Bank simulation. */
export const createDungeonStatisticsAccumulator = (initial: DungeonStatisticsSnapshot = initialState()): DungeonStatisticsAccumulator => {
  let state = cloneStatisticsState(initial)
  return {
    beginSession: (dungeonId) => { state = beginSessionSnapshot(state, dungeonId) },
    endSession: () => { state = endSessionSnapshot(state) },
    advance: (deltaMs, gameState) => { state = advanceStatisticsSnapshot(state, deltaMs, gameState) },
    beginRun: () => { state = state.session ? { ...state, session: { ...state.session, currentRunElapsedMs: 0 }, currentEncounter: null } : state },
    completeRun: (durationMs) => { state = completeRunState(state, durationMs) },
    beginEncounter: (monsterId, boss) => { state = beginEncounterState(state, monsterId, boss) },
    completeEncounter: (monsterId, durationMs, boss) => { state = completeEncounterState(state, monsterId, durationMs, boss) },
    consume: (event) => { state = consumeStatisticsEvent(state, event) },
    reset: () => { state = !state.session || !state.active ? initialState() : { session: newSession(state.session.dungeonId), active: true, currentEncounter: state.currentEncounter ? { ...state.currentEncounter, elapsedMs: 0 } : null } },
    clear: () => { state = initialState() },
    getState: () => state,
  }
}

export const useDungeonStatisticsStore = create<DungeonStatisticsStore>((set) => ({
  ...initialState(),
  beginSession: (dungeonId) => set((state) => beginSessionSnapshot(state, dungeonId)),
  endSession: (_reason) => set((state) => endSessionSnapshot(state)),
  advanceTime: (deltaMs, gameState) => set((state) => advanceStatisticsSnapshot(state, deltaMs, gameState)),
  beginRun: () => set((state) => state.session ? { ...state, session: { ...state.session, currentRunElapsedMs: 0 }, currentEncounter: null } : state),
  completeRun: (durationMs) => set((state) => completeRunState(state, durationMs)),
  beginEncounter: (monsterId, boss) => set((state) => state.active && state.session ? beginEncounterState(state, monsterId, boss) : state),
  completeEncounter: (monsterId, durationMs, boss) => set((state) => completeEncounterState(state, monsterId, durationMs, boss)),
  consumeEvent: (event) => set((state) => consumeStatisticsEvent(state, event)),
  reset: () => set((state) => {
    if (!state.session || !state.active) return initialState()
    const session = newSession(state.session.dungeonId)
    const currentEncounter = state.currentEncounter ? { ...state.currentEncounter, elapsedMs: 0 } : null
    return { session, active: true, currentEncounter }
  }),
  clear: () => set(initialState()),
}))

export const dungeonStatisticsObserver: DungeonStatisticsObserver = {
  beginSession: (dungeonId) => useDungeonStatisticsStore.getState().beginSession(dungeonId),
  endSession: (reason) => useDungeonStatisticsStore.getState().endSession(reason),
  advance: (deltaMs, state) => useDungeonStatisticsStore.getState().advanceTime(deltaMs, state),
  beginRun: () => useDungeonStatisticsStore.getState().beginRun(),
  completeRun: (durationMs) => useDungeonStatisticsStore.getState().completeRun(durationMs),
  beginEncounter: (monsterId, boss) => useDungeonStatisticsStore.getState().beginEncounter(monsterId, boss),
  completeEncounter: (monsterId, durationMs, boss) => useDungeonStatisticsStore.getState().completeEncounter(monsterId, durationMs, boss),
  consume: (event) => useDungeonStatisticsStore.getState().consumeEvent(event),
  reset: () => useDungeonStatisticsStore.getState().reset(),
  clear: () => useDungeonStatisticsStore.getState().clear(),
}

export const dungeonStatisticsSink: CombatEventSink = { push: (event) => dungeonStatisticsObserver.consume(event) }
export const clearDungeonStatistics = () => dungeonStatisticsObserver.clear()
