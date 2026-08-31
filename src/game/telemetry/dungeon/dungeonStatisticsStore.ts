import { create } from 'zustand'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import type { CombatEvent, CombatEventSink } from '../../systems/combat/combatTypes'
import type { DungeonId, GameState, ItemId, MonsterId } from '../../types'
import type { DungeonStatisticsObserver, DungeonStatisticsSession, DungeonStatisticsState } from './dungeonStatisticsTypes'

interface CurrentEncounter { monsterId: MonsterId; boss: boolean; elapsedMs: number }
interface DungeonStatisticsStore extends DungeonStatisticsState {
  currentEncounter: CurrentEncounter | null
  beginSession: (dungeonId: DungeonId) => void
  endSession: (reason: 'leave' | 'death' | 'dungeon-change') => void
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

const beginEncounterState = (state: DungeonStatisticsStore, monsterId: MonsterId, boss: boolean) => ({ ...state, currentEncounter: { monsterId, boss, elapsedMs: 0 } })
const completeEncounterState = (state: DungeonStatisticsStore, monsterId: MonsterId, durationMs: number, boss: boolean) => {
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
const completeRunState = (state: DungeonStatisticsStore, durationMs: number) => {
  if (!state.active || !state.session) return state
  const duration = validDuration(durationMs)
  const session = { ...state.session, completedRuns: state.session.completedRuns + 1, completedRunDurationTotalMs: state.session.completedRunDurationTotalMs + duration, currentRunElapsedMs: 0 }
  session.bestRunMs = session.bestRunMs === null ? duration : Math.min(session.bestRunMs, duration)
  return { ...state, session }
}

export const useDungeonStatisticsStore = create<DungeonStatisticsStore>((set) => ({
  ...initialState(),
  beginSession: (dungeonId) => set((state) => state.active && state.session?.dungeonId === dungeonId ? state : { session: newSession(dungeonId), active: true, currentEncounter: null }),
  endSession: (_reason) => set((state) => ({ ...state, active: false, currentEncounter: null })),
  advanceTime: (deltaMs, gameState) => set((state) => {
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
  }),
  beginRun: () => set((state) => state.session ? { ...state, session: { ...state.session, currentRunElapsedMs: 0 }, currentEncounter: null } : state),
  completeRun: (durationMs) => set((state) => completeRunState(state, durationMs)),
  beginEncounter: (monsterId, boss) => set((state) => state.active && state.session ? beginEncounterState(state, monsterId, boss) : state),
  completeEncounter: (monsterId, durationMs, boss) => set((state) => completeEncounterState(state, monsterId, durationMs, boss)),
  consumeEvent: (event) => set((state) => {
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
  }),
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
