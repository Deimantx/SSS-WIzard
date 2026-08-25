import type { GameState } from '../game/types'
import { migrateSave } from './migrations'
import { CURRENT_SAVE_VERSION, LEGACY_SAVE_KEY } from './saveSchema'

export const loadSave = (): { state: GameState | null; error: string | null } => {
  if (typeof localStorage === 'undefined') return { state: null, error: null }
  try {
    const raw = localStorage.getItem(LEGACY_SAVE_KEY)
    if (!raw) return { state: null, error: null }
    return { state: migrateSave(JSON.parse(raw)), error: null }
  } catch (error) {
    return { state: null, error: error instanceof Error ? error.message : 'Save could not be loaded.' }
  }
}

export const saveGame = (state: GameState) => {
  if (typeof localStorage === 'undefined') return
    const { lastOfflineBankReport: _transientReport, ...gameplayState } = state as GameState & { lastOfflineBankReport?: unknown }
    const clean = JSON.parse(JSON.stringify({ ...gameplayState, debug: undefined, notifications: [], saveVersion: CURRENT_SAVE_VERSION, lastSavedAt: Date.now() })) as GameState
    localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(clean))
}

export const clearSave = () => { if (typeof localStorage !== 'undefined') localStorage.removeItem(LEGACY_SAVE_KEY) }
