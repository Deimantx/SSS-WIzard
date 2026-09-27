import type { GameState } from '../../game/types'
import type { ProfileSlotId } from '../../profiles/profileTypes'
import { pushNotification } from '../../game/engine'
import { saveProfileGame } from '../../persistence/profileSaveManager'
import { type SaveReason } from '../../persistence/saveConstants'
import { updateProfileMetadata } from '../../profiles/profileStorage'

/** Persistence-specific state mutations stay separate from storage adapters. */
export const markSavedAt = (state: GameState, savedAt: number) => { state.lastSavedAt = savedAt }

export type PersistenceSaveResult = ReturnType<typeof saveProfileGame>
let lastBackgroundSaveErrorAt = 0

export const saveGameAction = (state: GameState, activeProfileId: ProfileSlotId | null, reason: SaveReason, savedAt: number): PersistenceSaveResult => {
  if (!activeProfileId) return { ok: false, error: 'No active profile.' }
  const result = saveProfileGame(activeProfileId, state, { savedAt })
  if (result.ok) { markSavedAt(state, savedAt); lastBackgroundSaveErrorAt = 0 }
  if (result.ok && reason === 'manual') pushNotification(state, 'Game saved', 'success')
  if (!result.ok && (reason === 'manual' || lastBackgroundSaveErrorAt === 0)) {
    lastBackgroundSaveErrorAt = savedAt
    pushNotification(state, result.error ?? 'Profile save failed.', 'warning')
  }
  if (result.ok) updateProfileMetadata(activeProfileId, { lastSavedAt: savedAt })
  return result
}

/** Saves a detached candidate. The caller owns the live-state commit and only applies it after this succeeds. */
export const saveGameCandidateAction = (candidate: GameState, activeProfileId: ProfileSlotId | null, savedAt: number): PersistenceSaveResult => {
  if (!activeProfileId) return { ok: false, error: 'No active profile.', kind: 'storage-unavailable', detail: 'No active profile.' }
  const result = saveProfileGame(activeProfileId, candidate, { savedAt })
  if (result.ok) {
    markSavedAt(candidate, savedAt)
    updateProfileMetadata(activeProfileId, { lastSavedAt: savedAt })
  }
  return result
}
