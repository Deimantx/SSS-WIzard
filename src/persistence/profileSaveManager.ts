import type { GameState } from '../game/types'
import { migrateSave } from './migrations'
import { CURRENT_SAVE_VERSION } from './saveSchema'
import { isProfileSlotId, profileSaveKey } from '../profiles/profileKeys'
import type { ProfileSlotId } from '../profiles/profileTypes'

export interface ProfileSaveResult {
  ok: boolean
  error: string | null
}

export const serializeGameState = (state: GameState) => {
  const { lastOfflineBankReport: _transientReport, recentAcquisitions: _transientAcquisitions, ...gameplayState } = state as GameState & { lastOfflineBankReport?: unknown; recentAcquisitions?: unknown }
  return JSON.parse(JSON.stringify({
  ...gameplayState,
  debug: undefined,
  notifications: [],
  saveVersion: CURRENT_SAVE_VERSION,
  lastSavedAt: state.lastSavedAt,
  })) as GameState
}

export const loadProfileGame = (slotId: ProfileSlotId): { state: GameState | null; error: string | null } => {
  if (!isProfileSlotId(slotId) || typeof localStorage === 'undefined') return { state: null, error: null }
  try {
    const raw = localStorage.getItem(profileSaveKey(slotId))
    if (!raw) return { state: null, error: null }
    return { state: migrateSave(JSON.parse(raw)), error: null }
  } catch (error) {
    return { state: null, error: error instanceof Error ? error.message : 'Profile save could not be loaded.' }
  }
}

export const saveProfileGame = (slotId: ProfileSlotId, state: GameState): ProfileSaveResult => {
  if (!isProfileSlotId(slotId)) return { ok: false, error: 'Invalid profile slot.' }
  if (typeof localStorage === 'undefined') return { ok: false, error: 'Browser storage is unavailable.' }
  try {
    localStorage.setItem(profileSaveKey(slotId), JSON.stringify(serializeGameState(state)))
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Profile save could not be written.' }
  }
}

export const clearProfileGame = (slotId: ProfileSlotId): ProfileSaveResult => {
  if (!isProfileSlotId(slotId)) return { ok: false, error: 'Invalid profile slot.' }
  if (typeof localStorage === 'undefined') return { ok: false, error: 'Browser storage is unavailable.' }
  try {
    localStorage.removeItem(profileSaveKey(slotId))
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Profile save could not be removed.' }
  }
}
