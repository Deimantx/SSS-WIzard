import { createInitialState } from '../store/initialState'
import { useGameStore } from '../store/gameStore'
import { recalculateDerivedStats } from '../game/engine'
import type { GameState } from '../game/types'
import type { GameStore } from '../store/gameStore'

let sessionSnapshot: GameState | null = null

const cloneGameData = (source: Pick<GameStore, keyof GameState>): GameState => {
  const keys = Object.keys(createInitialState()) as (keyof GameState)[]
  return structuredClone(Object.fromEntries(keys.map((key) => [key, source[key]]))) as unknown as GameState
}

/** Captures serializable game data in module memory only; it never writes profile or DevTools storage. */
export const captureTestSnapshot = (state: GameStore = useGameStore.getState()) => {
  sessionSnapshot = cloneGameData(state)
}

/** Restores the captured game data and re-derives HP/Mana caps before publishing it. */
export const restoreTestSnapshot = () => {
  if (!sessionSnapshot) return false
  const restored = cloneGameData(sessionSnapshot)
  recalculateDerivedStats(restored)
  useGameStore.setState(restored)
  return true
}

export const discardTestSnapshot = () => {
  if (!sessionSnapshot) return false
  sessionSnapshot = null
  return true
}

export const hasTestSnapshot = () => sessionSnapshot !== null
