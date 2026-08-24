import type { GameState } from '../game/types'
import { migrateSave } from './migrations'
import { SAVE_KEY } from './saveSchema'

export const loadSave = (): { state: GameState | null; error: string | null } => {
  if (typeof localStorage === 'undefined') return { state: null, error: null }
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return { state: null, error: null }
    return { state: migrateSave(JSON.parse(raw)), error: null }
  } catch (error) {
    return { state: null, error: error instanceof Error ? error.message : 'Save could not be loaded.' }
  }
}

export const saveGame = (state: GameState) => {
  if (typeof localStorage === 'undefined') return
  const clean = JSON.parse(JSON.stringify({ ...state, notifications: [], saveVersion: 2, lastSavedAt: Date.now() })) as GameState
  localStorage.setItem(SAVE_KEY, JSON.stringify(clean))
}

export const clearSave = () => { if (typeof localStorage !== 'undefined') localStorage.removeItem(SAVE_KEY) }
