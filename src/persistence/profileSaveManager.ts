import type { GameState } from '../game/types'
import { CURRENT_SAVE_VERSION } from './saveSchema'
import { isProfileSlotId, profileSaveBackupKey, profileSaveKey } from '../profiles/profileKeys'
import type { ProfileSlotId } from '../profiles/profileTypes'
import { validateSerializedSave, validateStoredSave } from './saveIntegrity'

export interface ProfileSaveResult {
  ok: boolean
  error: string | null
}

export const serializeGameState = (state: GameState, savedAt = state.lastSavedAt) => {
  const { lastOfflineBankReport: _transientReport, recentAcquisitions: _transientAcquisitions, ...gameplayState } = state as GameState & { lastOfflineBankReport?: unknown; recentAcquisitions?: unknown }
  return JSON.parse(JSON.stringify({
  ...gameplayState,
  debug: undefined,
  notifications: [],
  saveVersion: CURRENT_SAVE_VERSION,
  lastSavedAt: savedAt,
  })) as GameState
}

export interface ProfileLoadResult {
  state: GameState | null
  error: string | null
  source: 'primary' | 'backup' | null
  recovered: boolean
}

const emptyLoadResult = (): ProfileLoadResult => ({ state: null, error: null, source: null, recovered: false })
const loadFailure = (error: string): ProfileLoadResult => ({ state: null, error, source: null, recovered: false })

export const loadProfileGame = (slotId: ProfileSlotId): ProfileLoadResult => {
  if (!isProfileSlotId(slotId) || typeof localStorage === 'undefined') return emptyLoadResult()
  try {
    const primaryRaw = localStorage.getItem(profileSaveKey(slotId))
    if (primaryRaw) {
      const primary = validateStoredSave(primaryRaw)
      if (primary.ok && primary.state) return { state: primary.state, error: null, source: 'primary', recovered: false }
    }

    const backupRaw = localStorage.getItem(profileSaveBackupKey(slotId))
    if (backupRaw) {
      const backup = validateStoredSave(backupRaw)
      if (backup.ok && backup.state) return { state: backup.state, error: null, source: 'backup', recovered: true }
    }

    return primaryRaw ? loadFailure('Profile save could not be loaded. Primary and backup saves are invalid.') : emptyLoadResult()
  } catch (error) {
    return loadFailure(error instanceof Error ? error.message : 'Profile save could not be loaded.')
  }
}

const saveFailure = (detail: string): ProfileSaveResult => {
  console.error(`[profile-save] ${detail}`)
  return { ok: false, error: 'SAVE FAILED · Gameplay data was not overwritten.' }
}

export const saveProfileGame = (slotId: ProfileSlotId, state: GameState, options?: { savedAt?: number }): ProfileSaveResult => {
  if (!isProfileSlotId(slotId)) return { ok: false, error: 'Invalid profile slot.' }
  if (typeof localStorage === 'undefined') return { ok: false, error: 'Browser storage is unavailable.' }
  let previousPrimary: string | null = null
  let previousBackup: string | null = null
  let backupReplaced = false
  let primaryReadCompleted = false
  let primaryWriteAttempted = false
  try {
    const encoded = JSON.stringify(serializeGameState(state, options?.savedAt))
    const candidate = validateSerializedSave(encoded, state)
    if (!candidate.ok) return saveFailure(candidate.error ?? 'Critical gameplay data changed during save round-trip.')

    previousPrimary = localStorage.getItem(profileSaveKey(slotId))
    previousBackup = localStorage.getItem(profileSaveBackupKey(slotId))
    primaryReadCompleted = true
    if (previousPrimary) {
      const existing = validateStoredSave(previousPrimary)
      if (existing.ok) {
        localStorage.setItem(profileSaveBackupKey(slotId), previousPrimary)
        backupReplaced = true
      }
    }

    primaryWriteAttempted = true
    localStorage.setItem(profileSaveKey(slotId), encoded)
    const readBack = localStorage.getItem(profileSaveKey(slotId))
    if (!readBack) throw new Error('Save read-back returned no data.')
    const verified = validateSerializedSave(readBack, state)
    if (!verified.ok) throw new Error(verified.error ?? 'Save read-back validation failed.')
    return { ok: true, error: null }
  } catch (error) {
    try {
      if (primaryReadCompleted && primaryWriteAttempted) {
        if (previousPrimary !== null) localStorage.setItem(profileSaveKey(slotId), previousPrimary)
        else localStorage.removeItem(profileSaveKey(slotId))
      }
      if (backupReplaced) {
        if (previousBackup !== null) localStorage.setItem(profileSaveBackupKey(slotId), previousBackup)
        else localStorage.removeItem(profileSaveBackupKey(slotId))
      }
    } catch (restoreError) {
      console.error('[profile-save] Save failed and previous storage could not be fully restored.', restoreError)
    }
    return saveFailure(error instanceof Error ? error.message : 'Profile save could not be written.')
  }
}

export const clearProfileGame = (slotId: ProfileSlotId): ProfileSaveResult => {
  if (!isProfileSlotId(slotId)) return { ok: false, error: 'Invalid profile slot.' }
  if (typeof localStorage === 'undefined') return { ok: false, error: 'Browser storage is unavailable.' }
  try {
    localStorage.removeItem(profileSaveKey(slotId))
    localStorage.removeItem(profileSaveBackupKey(slotId))
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Profile save could not be removed.' }
  }
}
