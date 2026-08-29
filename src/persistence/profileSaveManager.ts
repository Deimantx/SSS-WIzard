import type { GameState } from '../game/types'
import { CURRENT_SAVE_VERSION, LEGACY_SAVE_BACKUP_KEY } from './saveSchema'
import { isProfileSlotId, profileSaveBackupKey, profileSaveKey, profileSaveRecoveryKey } from '../profiles/profileKeys'
import type { ProfileSlotId } from '../profiles/profileTypes'
import { attemptLegacySaveRecovery, validateSerializedSave, validateStoredSave } from './saveIntegrity'

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
  source: 'primary' | 'backup' | 'legacy-backup' | null
  recovered: boolean
  needsCanonicalRewrite: boolean
  diagnostics?: {
    primary: StoredCandidateDiagnostic
    backup: StoredCandidateDiagnostic
    legacyBackup?: StoredCandidateDiagnostic
  }
}

export interface StoredCandidateDiagnostic {
  present: boolean
  ok: boolean
  error: string | null
  saveVersion: number | null
}

const missingDiagnostic = (): StoredCandidateDiagnostic => ({ present: false, ok: false, error: null, saveVersion: null })
const inspectVersion = (encoded: string | null) => {
  if (encoded === null) return null
  try {
    const parsed: unknown = JSON.parse(encoded)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) && typeof (parsed as { saveVersion?: unknown }).saveVersion === 'number'
      ? (parsed as { saveVersion: number }).saveVersion
      : null
  } catch { return null }
}
const validateCandidate = (encoded: string | null): StoredCandidateDiagnostic => {
  if (encoded === null) return missingDiagnostic()
  const result = validateStoredSave(encoded)
  return { present: true, ok: result.ok, error: result.error, saveVersion: inspectVersion(encoded) }
}
const emptyLoadResult = (diagnostics?: ProfileLoadResult['diagnostics']): ProfileLoadResult => ({ state: null, error: null, source: null, recovered: false, needsCanonicalRewrite: false, diagnostics })
const loadFailure = (error: string, diagnostics: ProfileLoadResult['diagnostics']): ProfileLoadResult => ({ state: null, error, source: null, recovered: false, needsCanonicalRewrite: false, diagnostics })

const formatFailure = (diagnostics: NonNullable<ProfileLoadResult['diagnostics']>) => {
  const primary = diagnostics.primary
  const backup = diagnostics.backup
  const legacy = diagnostics.legacyBackup
  const unsupported = [primary, backup, legacy].find((candidate) => candidate?.error?.startsWith('Unsupported save version'))
  if (unsupported?.saveVersion !== null && unsupported?.saveVersion !== undefined) return `Profile save uses unsupported version ${unsupported.saveVersion}.`
  const missingVersion = [primary, backup, legacy].find((candidate) => candidate?.error === 'Save data is missing a valid saveVersion.')
  if (missingVersion) return 'Profile save is missing a valid saveVersion.'
  if (primary.present && !backup.present && !legacy?.present) return 'Profile save could not be loaded. Primary save failed validation. No profile backup exists.'
  if (primary.present && backup.present && !legacy?.present) return 'Profile save could not be loaded. Primary and profile backup both failed validation.'
  if (!primary.present && backup.present && !legacy?.present) return 'Profile save could not be loaded. Profile backup failed validation. Primary save is missing.'
  if (primary.present && !backup.present && legacy?.present) return 'Profile save could not be loaded. Primary and legacy backup both failed validation. Profile backup is missing.'
  if (!primary.present && backup.present && legacy?.present) return 'Profile save could not be loaded. Profile backup and legacy backup both failed validation. Primary save is missing.'
  if (!primary.present && !backup.present && legacy?.present) return 'Profile save could not be loaded. Legacy backup failed validation. Primary and profile backup are missing.'
  if (primary.present && backup.present && legacy?.present) return 'Profile save could not be loaded. Primary, profile backup, and legacy backup all failed validation.'
  return 'Profile save could not be loaded.'
}

const logDiagnostics = (slotId: ProfileSlotId, source: string, diagnostic: StoredCandidateDiagnostic) => {
  if (!import.meta.env.DEV) return
  if (!diagnostic.present) console.debug(`[profile-save] ${slotId} ${source} missing`)
  else if (diagnostic.ok) console.debug(`[profile-save] ${slotId} ${source} valid`, { saveVersion: diagnostic.saveVersion })
  else console.debug(`[profile-save] ${slotId} ${source} failed`, { saveVersion: diagnostic.saveVersion, error: diagnostic.error })
}

const preserveRescueSnapshot = (slotId: ProfileSlotId, raw: string | null) => {
  if (raw === null) return
  try {
    const key = profileSaveRecoveryKey(slotId)
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, raw)
      if (localStorage.getItem(key) !== raw && import.meta.env.DEV) console.debug(`[profile-save] ${slotId} rescue snapshot write could not be verified`)
    }
  } catch (error) {
    if (import.meta.env.DEV) console.debug(`[profile-save] ${slotId} rescue snapshot could not be written`, error instanceof Error ? error.message : error)
  }
}

const loadCandidate = (slotId: ProfileSlotId, raw: string | null, diagnostic: StoredCandidateDiagnostic, failedRaw: string | null) => {
  if (raw === null) return { state: null as GameState | null, failedRaw }
  if (diagnostic.ok) {
    const validated = validateStoredSave(raw)
    if (validated.ok && validated.state) return { state: validated.state, failedRaw }
  }
  const recovered = attemptLegacySaveRecovery(raw)
  if (recovered.state) {
    preserveRescueSnapshot(slotId, failedRaw ?? raw)
    return { state: recovered.state, failedRaw }
  }
  return { state: null, failedRaw: failedRaw ?? raw }
}

export const loadProfileGame = (slotId: ProfileSlotId): ProfileLoadResult => {
  if (!isProfileSlotId(slotId) || typeof localStorage === 'undefined') return emptyLoadResult()
  try {
    const primaryRaw = localStorage.getItem(profileSaveKey(slotId))
    const backupRaw = localStorage.getItem(profileSaveBackupKey(slotId))
    const legacyRaw = slotId === 'slot-1' ? localStorage.getItem(LEGACY_SAVE_BACKUP_KEY) : null
    const diagnostics = { primary: validateCandidate(primaryRaw), backup: validateCandidate(backupRaw), ...(slotId === 'slot-1' ? { legacyBackup: validateCandidate(legacyRaw) } : {}) }
    logDiagnostics(slotId, 'primary', diagnostics.primary)
    logDiagnostics(slotId, 'backup', diagnostics.backup)
    if (diagnostics.legacyBackup) logDiagnostics(slotId, 'legacy-backup', diagnostics.legacyBackup)

    let failedRaw: string | null = null
    const primary = loadCandidate(slotId, primaryRaw, diagnostics.primary, failedRaw)
    failedRaw = primary.failedRaw
    if (primary.state) return { state: primary.state, error: null, source: 'primary', recovered: !diagnostics.primary.ok, needsCanonicalRewrite: diagnostics.primary.saveVersion !== CURRENT_SAVE_VERSION || !diagnostics.primary.ok, diagnostics }
    const backup = loadCandidate(slotId, backupRaw, diagnostics.backup, failedRaw)
    failedRaw = backup.failedRaw
    if (backup.state) {
      preserveRescueSnapshot(slotId, failedRaw)
      return { state: backup.state, error: null, source: 'backup', recovered: true, needsCanonicalRewrite: true, diagnostics }
    }
    if (slotId === 'slot-1') {
      const legacy = loadCandidate(slotId, legacyRaw, diagnostics.legacyBackup!, failedRaw)
      failedRaw = legacy.failedRaw
      if (legacy.state) {
        preserveRescueSnapshot(slotId, failedRaw)
        return { state: legacy.state, error: null, source: 'legacy-backup', recovered: true, needsCanonicalRewrite: true, diagnostics }
      }
    }
    return primaryRaw !== null || backupRaw !== null || legacyRaw !== null ? loadFailure(formatFailure(diagnostics), diagnostics) : emptyLoadResult(diagnostics)
  } catch (error) {
    return loadFailure(error instanceof Error ? error.message : 'Profile save could not be loaded.', { primary: missingDiagnostic(), backup: missingDiagnostic() })
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
