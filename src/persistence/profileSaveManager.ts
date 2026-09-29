import type { GameState } from '../game/types'
import { createInitialState } from '../store/initialState'
import { isProfileSlotId, profileSaveBackupKey, profileSaveKey } from '../profiles/profileKeys'
import type { ProfileSlotId } from '../profiles/profileTypes'
import { recordRecoveredProfile, recordSaveFailure, recordSuccessfulSave, type SaveFailureKind } from './saveDiagnosticsStore'
import { isDeveloperTestSessionSavePaused } from './developerTestSessionSaveGuard'
import { validateSerializedSave, validateStoredSave, type SaveValidationReport } from './saveIntegrity'
import { serializeGameStateV1 } from './v2/saveSerializer'

export interface ProfileSaveResult { ok: boolean; error: string | null; kind?: SaveFailureKind; detail?: string; serializedBytes?: number; validationReport?: SaveValidationReport }
export interface StoredCandidateDiagnostic { present: boolean; ok: boolean; error: string | null; saveVersion: number | null; savedAt: number | null; progression: null }
export interface ProfileSaveDiagnostics { primary: StoredCandidateDiagnostic; backup: StoredCandidateDiagnostic }
export interface ProfileStorageFootprint { candidateBytes: number; primaryBytes: number; backupBytes: number; totalKnownBytes: number; sigilCount: number; rollHistoryEntries: number; inventoryKeyCount: number; topLevelBytes: Record<string, number> }
export interface ProfileLoadResult { state: GameState | null; error: string | null; source: 'primary' | 'backup' | null; recovered: boolean; needsCanonicalRewrite: boolean; diagnostics?: ProfileSaveDiagnostics }

const byteLength = (value: string | null) => value === null ? 0 : typeof Blob !== 'undefined' ? new Blob([value]).size : value.length * 2
const missing = (): StoredCandidateDiagnostic => ({ present: false, ok: false, error: null, saveVersion: null, savedAt: null, progression: null })
const candidate = (raw: string | null): StoredCandidateDiagnostic => {
  if (raw === null) return missing()
  const valid = validateStoredSave(raw)
  let version: number | null = null
  let savedAt: number | null = null
  try { const parsed = JSON.parse(raw) as { schemaVersion?: unknown; savedAt?: unknown }; version = typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : null; savedAt = typeof parsed.savedAt === 'number' ? parsed.savedAt : null } catch { /* Invalid JSON is reported by schema validation. */ }
  return { present: true, ok: valid.ok, error: valid.error, saveVersion: version, savedAt, progression: null }
}

const readCandidates = (slotId: ProfileSlotId) => {
  const primary = localStorage.getItem(profileSaveKey(slotId))
  const backup = localStorage.getItem(profileSaveBackupKey(slotId))
  const diagnostics: ProfileSaveDiagnostics = { primary: candidate(primary), backup: candidate(backup) }
  return { primary, backup, diagnostics }
}

export const serializeGameState = serializeGameStateV1

export const getProfileSaveDiagnostics = (slotId: ProfileSlotId): ProfileSaveDiagnostics => {
  const empty = (): ProfileSaveDiagnostics => ({ primary: missing(), backup: missing() })
  if (!isProfileSlotId(slotId) || typeof localStorage === 'undefined') return empty()
  try { return readCandidates(slotId).diagnostics } catch { return empty() }
}

export const getProfileStorageFootprint = (slotId: ProfileSlotId, candidateState?: GameState): ProfileStorageFootprint => {
  const empty: ProfileStorageFootprint = { candidateBytes: 0, primaryBytes: 0, backupBytes: 0, totalKnownBytes: 0, sigilCount: 0, rollHistoryEntries: 0, inventoryKeyCount: 0, topLevelBytes: {} }
  if (!isProfileSlotId(slotId) || typeof localStorage === 'undefined') return empty
  try {
    const { primary, backup } = readCandidates(slotId)
    const state = candidateState ?? (primary ? validateStoredSave(primary).state : null)
    const serialized = candidateState ? serializeGameState(candidateState) : null
    const topLevelBytes = serialized ? Object.fromEntries(Object.entries(serialized).map(([key, value]) => [key, byteLength(JSON.stringify(value))])) : {}
    return { ...empty, candidateBytes: serialized ? byteLength(JSON.stringify(serialized)) : 0, primaryBytes: byteLength(primary), backupBytes: byteLength(backup), totalKnownBytes: byteLength(primary) + byteLength(backup), sigilCount: state ? Object.keys(state.sigils.storage).length : 0, rollHistoryEntries: state ? Object.values(state.sigils.storage).reduce((sum, sigil) => sum + sigil.rollHistory.length, 0) : 0, inventoryKeyCount: state ? Object.keys(state.inventory).length : 0, topLevelBytes }
  } catch { return empty }
}

export const validateProfileCandidate = (slotId: ProfileSlotId | null, state: GameState): ProfileSaveResult => {
  if (!isProfileSlotId(slotId)) return { ok: false, error: 'Invalid profile slot.', kind: 'validation' }
  if (typeof localStorage === 'undefined') return { ok: false, error: 'Browser storage is unavailable.', kind: 'storage-unavailable' }
  try {
    const encoded = JSON.stringify(serializeGameState(state, state.lastSavedAt))
    const result = validateSerializedSave(encoded, state)
    const serializedBytes = byteLength(encoded)
    return result.ok ? { ok: true, error: null, serializedBytes, validationReport: result.report } : { ok: false, error: result.error, kind: 'validation', detail: result.error ?? undefined, serializedBytes, validationReport: result.report }
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Profile could not be serialized.', kind: 'serialization' } }
}

export const loadProfileGame = (slotId: ProfileSlotId): ProfileLoadResult => {
  if (!isProfileSlotId(slotId) || typeof localStorage === 'undefined') return { state: null, error: null, source: null, recovered: false, needsCanonicalRewrite: false }
  try {
    const { primary, backup, diagnostics } = readCandidates(slotId)
    for (const [source, raw] of [['primary', primary], ['backup', backup]] as const) {
      if (!raw) continue
      const result = validateStoredSave(raw)
      if (result.ok && result.state) {
        const recovered = source === 'backup'
        if (recovered) recordRecoveredProfile(slotId)
        return { state: result.state, error: null, source, recovered, needsCanonicalRewrite: recovered, diagnostics }
      }
    }
    const anySave = primary !== null || backup !== null
    return anySave
      ? { state: createInitialState(), error: null, source: null, recovered: false, needsCanonicalRewrite: true, diagnostics }
      : { state: null, error: null, source: null, recovered: false, needsCanonicalRewrite: false, diagnostics }
  } catch (error) { return { state: null, error: error instanceof Error ? error.message : 'Profile save could not be loaded.', source: null, recovered: false, needsCanonicalRewrite: false, diagnostics: getProfileSaveDiagnostics(slotId) } }
}

const reportSaveFailure = (slotId: ProfileSlotId, error: string, kind: SaveFailureKind, serializedBytes?: number, report?: SaveValidationReport): ProfileSaveResult => {
  recordSaveFailure(slotId, error, { kind, detail: error, serializedBytes, validationReport: report })
  return { ok: false, error, kind, detail: error, serializedBytes, validationReport: report }
}

const writeVerified = (key: string, value: string | null) => {
  if (value === null) localStorage.removeItem(key)
  else localStorage.setItem(key, value)
  if (localStorage.getItem(key) !== value) throw new Error(`Save write verification failed for ${key}.`)
}

export const saveProfileGame = (slotId: ProfileSlotId, state: GameState, options?: { savedAt?: number; explicitReset?: boolean }): ProfileSaveResult => {
  if (isDeveloperTestSessionSavePaused()) return { ok: false, error: 'Profile saving is paused during Developer Test Session.', kind: 'unknown', detail: 'Developer test session save interlock is active.' }
  if (!isProfileSlotId(slotId)) return { ok: false, error: 'Invalid profile slot.', kind: 'validation' }
  if (typeof localStorage === 'undefined') return reportSaveFailure(slotId, 'Browser storage is unavailable.', 'storage-unavailable')
  let priorPrimary: string | null = null
  let priorBackup: string | null = null
  let started = false
  let serializedBytes: number | undefined
  try {
    const encoded = JSON.stringify(serializeGameState(state, options?.savedAt ?? state.lastSavedAt))
    serializedBytes = byteLength(encoded)
    const validated = validateSerializedSave(encoded, state)
    if (!validated.ok) return reportSaveFailure(slotId, validated.error ?? 'Save validation failed.', 'validation', serializedBytes, validated.report)
    const primaryKey = profileSaveKey(slotId)
    const backupKey = profileSaveBackupKey(slotId)
    priorPrimary = localStorage.getItem(primaryKey)
    priorBackup = localStorage.getItem(backupKey)
    started = true
    const previousValid = priorPrimary && validateStoredSave(priorPrimary).ok ? priorPrimary : null
    if (options?.explicitReset) writeVerified(backupKey, null)
    else if (previousValid) writeVerified(backupKey, previousValid)
    else if (priorBackup && !validateStoredSave(priorBackup).ok) writeVerified(backupKey, null)
    writeVerified(primaryKey, encoded)
    recordSuccessfulSave(slotId, options?.savedAt ?? state.lastSavedAt)
    return { ok: true, error: null, serializedBytes, validationReport: validated.report }
  } catch (error) {
    if (started) {
      try { writeVerified(profileSaveKey(slotId), priorPrimary); writeVerified(profileSaveBackupKey(slotId), priorBackup) } catch (restoreError) { console.error('[profile-save-v2] previous keys could not be restored', restoreError) }
    }
    const message = error instanceof Error ? error.message : 'Profile save could not be written.'
    const kind: SaveFailureKind = typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'QuotaExceededError' ? 'quota' : message.startsWith('Save write verification failed') ? 'write-verification' : 'unknown'
    return reportSaveFailure(slotId, message, kind, serializedBytes)
  }
}

export const clearProfileGame = (slotId: ProfileSlotId): ProfileSaveResult => {
  if (!isProfileSlotId(slotId)) return { ok: false, error: 'Invalid profile slot.' }
  if (typeof localStorage === 'undefined') return { ok: false, error: 'Browser storage is unavailable.' }
  try { localStorage.removeItem(profileSaveKey(slotId)); localStorage.removeItem(profileSaveBackupKey(slotId)); return { ok: true, error: null } }
  catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Profile save could not be removed.' } }
}

export const resetProfileGame = (slotId: ProfileSlotId, state: GameState, options?: { savedAt?: number }) => saveProfileGame(slotId, state, { ...options, explicitReset: true })
