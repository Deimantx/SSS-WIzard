import type { GameState } from '../game/types'
import { CURRENT_SAVE_VERSION, LEGACY_SAVE_BACKUP_KEY } from './saveSchema'
import {
  isProfileSlotId,
  profileSaveBackup2Key,
  profileSaveBackup3Key,
  profileSaveBackupKey,
  profileSaveKey,
  profileSaveRecoveryKey,
  profileSaveSuspectKey,
} from '../profiles/profileKeys'
import type { ProfileSlotId } from '../profiles/profileTypes'
import { attemptLegacySaveRecovery, validateSerializedSave, validateStoredSave, type SaveValidationReport } from './saveIntegrity'
import { detectCatastrophicProgressRegression, getProgressionEvidence, summarizeProgressionEvidence, type ProgressionEvidenceSummary, type ProgressionRegressionResult } from './progressionEvidence'
import { recordRecoveredProfile, recordSaveFailure, recordSuccessfulSave, type SaveFailureKind } from './saveDiagnosticsStore'
import { isDeveloperTestSessionSavePaused } from './developerTestSessionSaveGuard'

export interface ProfileSaveResult {
  ok: boolean
  error: string | null
  kind?: SaveFailureKind
  detail?: string
  serializedBytes?: number
  validationReport?: SaveValidationReport
}

export const serializeGameState = (state: GameState, savedAt = state.lastSavedAt) => {
  const { lastOfflineBankReport: _transientReport, recentAcquisitions: _transientAcquisitions, debug: _debug, ...gameplayState } = state as GameState & { lastOfflineBankReport?: unknown; recentAcquisitions?: unknown }
  const { godMode: _legacyGodMode, ...safePlayer } = gameplayState.player as typeof gameplayState.player & { godMode?: boolean }
  return { ...gameplayState, player: safePlayer, notifications: [], saveVersion: CURRENT_SAVE_VERSION, lastSavedAt: savedAt } as unknown as GameState
}

export interface StoredCandidateDiagnostic {
  present: boolean
  ok: boolean
  error: string | null
  saveVersion: number | null
  savedAt: number | null
  progression: ProgressionEvidenceSummary | null
}

export interface ProfileSaveDiagnostics {
  primary: StoredCandidateDiagnostic
  /** Compatibility alias for the original rotating backup key. */
  backup: StoredCandidateDiagnostic
  backup1: StoredCandidateDiagnostic
  backup2: StoredCandidateDiagnostic
  backup3: StoredCandidateDiagnostic
  recovery: StoredCandidateDiagnostic
  suspect: StoredCandidateDiagnostic
  legacyBackup?: StoredCandidateDiagnostic
}

export interface ProfileStorageFootprint {
  candidateBytes: number
  primaryBytes: number
  backup1Bytes: number
  backup2Bytes: number
  backup3Bytes: number
  recoveryBytes: number
  suspectBytes: number
  totalKnownBytes: number
  sigilCount: number
  rollHistoryEntries: number
  inventoryKeyCount: number
  topLevelBytes: Record<string, number>
}

export interface ProfileLoadResult {
  state: GameState | null
  error: string | null
  source: 'primary' | 'backup' | 'backup-2' | 'backup-3' | 'legacy-backup' | null
  recovered: boolean
  needsCanonicalRewrite: boolean
  diagnostics?: ProfileSaveDiagnostics
}

type CandidateSource = 'primary' | 'backup' | 'backup-2' | 'backup-3' | 'legacy-backup'
interface Candidate { source: CandidateSource; raw: string | null; diagnostic: StoredCandidateDiagnostic; state: GameState | null; recovered: boolean }

const missingDiagnostic = (): StoredCandidateDiagnostic => ({ present: false, ok: false, error: null, saveVersion: null, savedAt: null, progression: null })

const inspectJson = (encoded: string | null) => {
  if (encoded === null) return { saveVersion: null, savedAt: null }
  try {
    const parsed: unknown = JSON.parse(encoded)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { saveVersion: null, savedAt: null }
    const object = parsed as { saveVersion?: unknown; lastSavedAt?: unknown }
    return {
      saveVersion: typeof object.saveVersion === 'number' && Number.isInteger(object.saveVersion) ? object.saveVersion : null,
      savedAt: typeof object.lastSavedAt === 'number' && Number.isFinite(object.lastSavedAt) && object.lastSavedAt >= 0 ? object.lastSavedAt : null,
    }
  } catch { return { saveVersion: null, savedAt: null } }
}

const validateCandidate = (encoded: string | null): StoredCandidateDiagnostic => {
  if (encoded === null) return missingDiagnostic()
  const inspected = inspectJson(encoded)
  const result = validateStoredSave(encoded)
  return {
    present: true,
    ok: result.ok,
    error: result.error,
    saveVersion: inspected.saveVersion,
    savedAt: inspected.savedAt,
    progression: result.state ? summarizeProgressionEvidence(getProgressionEvidence(result.state)) : null,
  }
}

const emptyDiagnostics = (includeLegacy = false): ProfileSaveDiagnostics => ({
  primary: missingDiagnostic(), backup: missingDiagnostic(), backup1: missingDiagnostic(), backup2: missingDiagnostic(), backup3: missingDiagnostic(),
  recovery: missingDiagnostic(), suspect: missingDiagnostic(), ...(includeLegacy ? { legacyBackup: missingDiagnostic() } : {}),
})
const emptyLoadResult = (diagnostics?: ProfileSaveDiagnostics): ProfileLoadResult => ({ state: null, error: null, source: null, recovered: false, needsCanonicalRewrite: false, diagnostics })
const loadFailure = (error: string, diagnostics: ProfileSaveDiagnostics): ProfileLoadResult => ({ state: null, error, source: null, recovered: false, needsCanonicalRewrite: false, diagnostics })

const readRawCandidates = (slotId: ProfileSlotId) => {
  const includeLegacy = slotId === 'slot-1'
  const raws = {
    primary: localStorage.getItem(profileSaveKey(slotId)),
    backup: localStorage.getItem(profileSaveBackupKey(slotId)),
    backup2: localStorage.getItem(profileSaveBackup2Key(slotId)),
    backup3: localStorage.getItem(profileSaveBackup3Key(slotId)),
    ...(includeLegacy ? { legacyBackup: localStorage.getItem(LEGACY_SAVE_BACKUP_KEY) } : {}),
  }
  const diagnostics: ProfileSaveDiagnostics = {
    primary: validateCandidate(raws.primary), backup: validateCandidate(raws.backup), backup1: validateCandidate(raws.backup),
    backup2: validateCandidate(raws.backup2), backup3: validateCandidate(raws.backup3),
    recovery: validateCandidate(localStorage.getItem(profileSaveRecoveryKey(slotId))),
    suspect: validateCandidate(localStorage.getItem(profileSaveSuspectKey(slotId))),
    ...(includeLegacy ? { legacyBackup: validateCandidate(raws.legacyBackup ?? null) } : {}),
  }
  return { raws, diagnostics }
}

const preserveSnapshot = (slotId: ProfileSlotId, key: string, raw: string | null, overwrite = false) => {
  if (raw === null) return
  try {
    if (overwrite || localStorage.getItem(key) === null) {
      localStorage.setItem(key, raw)
      if (localStorage.getItem(key) !== raw && import.meta.env.DEV) console.debug(`[profile-save] ${slotId} snapshot write could not be verified`, key)
    }
  } catch (error) {
    if (import.meta.env.DEV) console.debug(`[profile-save] ${slotId} snapshot could not be written`, key, error instanceof Error ? error.message : error)
  }
}
const preserveRecoverySnapshot = (slotId: ProfileSlotId, raw: string | null) => preserveSnapshot(slotId, profileSaveRecoveryKey(slotId), raw)
const preserveSuspectSnapshot = (slotId: ProfileSlotId, raw: string | null) => preserveSnapshot(slotId, profileSaveSuspectKey(slotId), raw)

const candidateFromRaw = (slotId: ProfileSlotId, source: CandidateSource, raw: string | null, diagnostic: StoredCandidateDiagnostic): Candidate => {
  if (raw === null) return { source, raw, diagnostic, state: null, recovered: false }
  if (diagnostic.ok) {
    const validated = validateStoredSave(raw)
    if (validated.ok && validated.state) return { source, raw, diagnostic, state: validated.state, recovered: false }
  }
  const recovered = attemptLegacySaveRecovery(raw)
  if (recovered.state) {
    preserveRecoverySnapshot(slotId, raw)
    return { source, raw, diagnostic, state: recovered.state, recovered: true }
  }
  try { JSON.parse(raw) } catch { preserveRecoverySnapshot(slotId, raw) }
  return { source, raw, diagnostic, state: null, recovered: false }
}

const candidateDiagnostic = (source: CandidateSource, diagnostics: ProfileSaveDiagnostics) => source === 'primary'
  ? diagnostics.primary
  : source === 'backup'
    ? diagnostics.backup1
    : source === 'backup-2'
      ? diagnostics.backup2
      : source === 'backup-3'
        ? diagnostics.backup3
        : diagnostics.legacyBackup ?? missingDiagnostic()

const sourceOrder: CandidateSource[] = ['primary', 'backup', 'backup-2', 'backup-3', 'legacy-backup']
const loadCandidates = (slotId: ProfileSlotId, raws: ReturnType<typeof readRawCandidates>['raws'], diagnostics: ProfileSaveDiagnostics) => sourceOrder
  .filter((source) => source !== 'legacy-backup' || slotId === 'slot-1')
  .map((source) => {
    const raw = source === 'primary' ? raws.primary : source === 'backup' ? raws.backup : source === 'backup-2' ? raws.backup2 : source === 'backup-3' ? raws.backup3 : raws.legacyBackup ?? null
    return candidateFromRaw(slotId, source, raw, candidateDiagnostic(source, diagnostics))
  })

const logDiagnostics = (slotId: ProfileSlotId, source: string, diagnostic: StoredCandidateDiagnostic) => {
  if (!import.meta.env.DEV) return
  if (!diagnostic.present) console.debug(`[profile-save] ${slotId} ${source} missing`)
  else if (diagnostic.ok) console.debug(`[profile-save] ${slotId} ${source} valid`, { saveVersion: diagnostic.saveVersion, savedAt: diagnostic.savedAt, progression: diagnostic.progression })
  else console.debug(`[profile-save] ${slotId} ${source} failed`, { saveVersion: diagnostic.saveVersion, error: diagnostic.error })
}

const selectSafestCandidate = (slotId: ProfileSlotId, candidates: Candidate[]) => {
  const valid = candidates.filter((candidate): candidate is Candidate & { state: GameState } => Boolean(candidate.state))
  const suspicious = new Set<CandidateSource>()
  valid.forEach((candidate) => valid.forEach((other) => {
    if (candidate === other) return
    const regression = detectCatastrophicProgressRegression(other.state, candidate.state)
    if (regression.catastrophic) {
      suspicious.add(candidate.source)
      logProgressionRegression(slotId, other.source, regression)
    }
  }))
  valid.filter((candidate) => suspicious.has(candidate.source)).forEach((candidate) => preserveSuspectSnapshot(slotId, candidate.raw))
  return { selected: valid.find((candidate) => !suspicious.has(candidate.source)) ?? valid[0] ?? null, suspicious }
}

export const getProfileSaveDiagnostics = (slotId: ProfileSlotId): ProfileSaveDiagnostics => {
  if (!isProfileSlotId(slotId) || typeof localStorage === 'undefined') return emptyDiagnostics(slotId === 'slot-1')
  try { return readRawCandidates(slotId).diagnostics } catch { return emptyDiagnostics(slotId === 'slot-1') }
}

const byteLength = (value: string | null) => value === null ? 0 : typeof Blob !== 'undefined' ? new Blob([value]).size : value.length * 2

export const getProfileStorageFootprint = (slotId: ProfileSlotId, candidateState?: GameState): ProfileStorageFootprint => {
  const empty: ProfileStorageFootprint = { candidateBytes: 0, primaryBytes: 0, backup1Bytes: 0, backup2Bytes: 0, backup3Bytes: 0, recoveryBytes: 0, suspectBytes: 0, totalKnownBytes: 0, sigilCount: 0, rollHistoryEntries: 0, inventoryKeyCount: 0, topLevelBytes: {} }
  if (!isProfileSlotId(slotId) || typeof localStorage === 'undefined') return empty
  try {
    const raws = readRawCandidates(slotId).raws
    const primary = raws.primary
    const parsed = candidateState ?? (primary ? validateStoredSave(primary).state : null)
    const topLevelBytes: Record<string, number> = {}
    if (candidateState) Object.entries(serializeGameState(candidateState)).forEach(([key, value]) => { try { topLevelBytes[key] = byteLength(JSON.stringify(value)) } catch { topLevelBytes[key] = 0 } })
    const values = [primary, raws.backup, raws.backup2, raws.backup3, localStorage.getItem(profileSaveRecoveryKey(slotId)), localStorage.getItem(profileSaveSuspectKey(slotId))]
    return {
      candidateBytes: candidateState ? byteLength(JSON.stringify(serializeGameState(candidateState))) : 0,
      primaryBytes: byteLength(primary), backup1Bytes: byteLength(raws.backup), backup2Bytes: byteLength(raws.backup2), backup3Bytes: byteLength(raws.backup3), recoveryBytes: byteLength(values[4]), suspectBytes: byteLength(values[5]),
      totalKnownBytes: values.reduce((sum, value) => sum + byteLength(value), 0),
      sigilCount: parsed ? Object.keys(parsed.sigils.storage).length : 0,
      rollHistoryEntries: parsed ? Object.values(parsed.sigils.storage).reduce((sum, sigil) => sum + sigil.rollHistory.length, 0) : 0,
      inventoryKeyCount: parsed ? Object.keys(parsed.inventory).length : 0,
      topLevelBytes,
    }
  } catch { return empty }
}

export const validateProfileCandidate = (slotId: ProfileSlotId | null, state: GameState): ProfileSaveResult => {
  if (!isProfileSlotId(slotId)) return { ok: false, error: 'Invalid profile slot.', kind: 'validation', detail: 'Invalid profile slot.' }
  if (typeof localStorage === 'undefined') return { ok: false, error: 'Browser storage is unavailable.', kind: 'storage-unavailable', detail: 'Browser storage is unavailable.' }
  try {
    const encoded = JSON.stringify(serializeGameState(state, state.lastSavedAt))
    const serializedBytes = typeof Blob !== 'undefined' ? new Blob([encoded]).size : encoded.length * 2
    const result = validateSerializedSave(encoded, state)
    return result.ok
      ? { ok: true, error: null, serializedBytes, validationReport: result.report }
      : { ok: false, error: result.error ?? 'Profile validation failed.', kind: 'validation', detail: result.error ?? 'Profile validation failed.', serializedBytes, validationReport: result.report }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Profile could not be serialized.', kind: 'serialization', detail: error instanceof Error ? error.message : 'Profile could not be serialized.' }
  }
}

export const loadProfileGame = (slotId: ProfileSlotId): ProfileLoadResult => {
  if (!isProfileSlotId(slotId) || typeof localStorage === 'undefined') return emptyLoadResult()
  try {
    const { raws, diagnostics } = readRawCandidates(slotId)
    logDiagnostics(slotId, 'primary', diagnostics.primary)
    logDiagnostics(slotId, 'backup-1', diagnostics.backup1)
    logDiagnostics(slotId, 'backup-2', diagnostics.backup2)
    logDiagnostics(slotId, 'backup-3', diagnostics.backup3)
    if (diagnostics.legacyBackup) logDiagnostics(slotId, 'legacy-backup', diagnostics.legacyBackup)
    const { selected, suspicious } = selectSafestCandidate(slotId, loadCandidates(slotId, raws, diagnostics))
    if (selected?.state) {
      const recovered = selected.source !== 'primary' || selected.recovered || suspicious.has(selected.source)
      if (recovered) recordRecoveredProfile(slotId)
      return {
        state: selected.state,
        error: null,
        source: selected.source,
        recovered,
        needsCanonicalRewrite: selected.source !== 'primary' || selected.recovered || diagnostics.primary.saveVersion !== CURRENT_SAVE_VERSION || !diagnostics.primary.ok,
        diagnostics,
      }
    }
    const anyRaw = Object.values(raws).some((raw) => raw !== null)
    return anyRaw ? loadFailure(formatFailure(diagnostics), diagnostics) : emptyLoadResult(diagnostics)
  } catch (error) {
    return loadFailure(error instanceof Error ? error.message : 'Profile save could not be loaded.', emptyDiagnostics(slotId === 'slot-1'))
  }
}

const formatFailure = (diagnostics: ProfileSaveDiagnostics) => {
  const candidates = [diagnostics.primary, diagnostics.backup1, diagnostics.backup2, diagnostics.backup3, diagnostics.legacyBackup]
  const unsupported = candidates.find((candidate) => candidate?.error?.startsWith('Unsupported save version'))
  if (unsupported?.saveVersion !== null && unsupported?.saveVersion !== undefined) return `Profile save uses unsupported version ${unsupported.saveVersion}.`
  if (candidates.some((candidate) => candidate?.error === 'Save data is missing a valid saveVersion.')) return 'Profile save is missing a valid saveVersion.'
  const primary = diagnostics.primary
  const backup = diagnostics.backup1
  const legacy = diagnostics.legacyBackup
  const noNewBackups = !diagnostics.backup2.present && !diagnostics.backup3.present
  if (primary.present && !backup.present && !legacy?.present && noNewBackups) return 'Profile save could not be loaded. Primary save failed validation. No profile backup exists.'
  if (primary.present && backup.present && !legacy?.present && noNewBackups) return 'Profile save could not be loaded. Primary and profile backup both failed validation.'
  if (!primary.present && backup.present && !legacy?.present && noNewBackups) return 'Profile save could not be loaded. Profile backup failed validation. Primary save is missing.'
  if (primary.present && !backup.present && legacy?.present && noNewBackups) return 'Profile save could not be loaded. Primary and legacy backup both failed validation. Profile backup is missing.'
  if (!primary.present && backup.present && legacy?.present && noNewBackups) return 'Profile save could not be loaded. Profile backup and legacy backup both failed validation. Primary save is missing.'
  if (!primary.present && !backup.present && legacy?.present && noNewBackups) return 'Profile save could not be loaded. Legacy backup failed validation. Primary and profile backup are missing.'
  if (primary.present && backup.present && legacy?.present && noNewBackups) return 'Profile save could not be loaded. Primary, profile backup, and legacy backup all failed validation.'
  return 'Profile save could not be loaded.'
}

const logProgressionRegression = (slotId: ProfileSlotId, source: CandidateSource, regression: ProgressionRegressionResult) => {
  if (!import.meta.env.DEV) return
  regression.details.forEach((detail) => console.error('[save-protection]', {
    profile: slotId,
    source,
    field: detail.field,
    key: detail.key,
    previous: detail.previous,
    candidate: detail.candidate,
  }))
}

const isQuotaError = (error: unknown) => typeof DOMException !== 'undefined' && error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
const saveFailure = (slotId: ProfileSlotId, detail: string, regression = false, source?: CandidateSource, regressionResult?: ProgressionRegressionResult, kind: SaveFailureKind = regression ? 'regression' : 'unknown', serializedBytes?: number, validationReport?: SaveValidationReport): ProfileSaveResult => {
  if (regression && source && regressionResult) logProgressionRegression(slotId, source, regressionResult)
  console.error(`[profile-save] ${detail}`)
  const message = regression
    ? 'SAVE PROTECTION ACTIVE · A possible progression rollback was blocked.'
    : 'SAVE FAILED · The game could not write to browser storage.'
  const userMessage = regression
    ? message
    : kind === 'validation'
      ? 'SAVE FAILED Â· VALIDATION BLOCKED Â· The profile was not changed. Review the exact field paths in Developer Tools diagnostics.'
      : kind === 'quota'
      ? 'SAVE STORAGE FULL · The current profile is too large for browser storage. Your previous valid save was preserved.'
      : kind === 'storage-unavailable'
        ? 'SAVE FAILED · Browser storage is unavailable. Your previous valid save was preserved.'
        : 'SAVE FAILED · The profile could not be written. Your previous valid save was preserved.'
  recordSaveFailure(slotId, userMessage, regression, { kind, detail, serializedBytes, validationReport })
  return { ok: false, error: userMessage, kind, detail, serializedBytes, validationReport }
}

const storageKeys = (slotId: ProfileSlotId) => [profileSaveKey(slotId), profileSaveBackupKey(slotId), profileSaveBackup2Key(slotId), profileSaveBackup3Key(slotId)]
const writeVerified = (key: string, value: string | null) => {
  if (value === null) localStorage.removeItem(key)
  else localStorage.setItem(key, value)
  if (localStorage.getItem(key) !== value) throw new Error(`Save write verification failed for ${key}.`)
}

export const saveProfileGame = (slotId: ProfileSlotId, state: GameState, options?: { savedAt?: number; explicitReset?: boolean }): ProfileSaveResult => {
  if (isDeveloperTestSessionSavePaused()) return { ok: false, error: 'Profile saving is paused during Developer Test Session.', kind: 'unknown', detail: 'Developer test session save interlock is active.' }
  if (!isProfileSlotId(slotId)) return { ok: false, error: 'Invalid profile slot.' }
  if (typeof localStorage === 'undefined') return saveFailure(slotId, 'Browser storage is unavailable.', false, undefined, undefined, 'storage-unavailable')
  let previous: (string | null)[] = []
  let transactionStarted = false
  let serializedBytes: number | undefined
  try {
    const savedAt = options?.savedAt ?? state.lastSavedAt
    let encoded: string
    try { encoded = JSON.stringify(serializeGameState(state, savedAt)) } catch (error) {
      return saveFailure(slotId, error instanceof Error ? error.message : 'Profile could not be serialized.', false, undefined, undefined, 'serialization')
    }
    serializedBytes = typeof Blob !== 'undefined' ? new Blob([encoded]).size : encoded.length * 2
    const candidate = validateSerializedSave(encoded, state)
    if (!candidate.ok) return saveFailure(slotId, candidate.error ?? 'Critical gameplay data changed during save round-trip.', false, undefined, undefined, 'validation', serializedBytes, candidate.report)

    const existing = readRawCandidates(slotId)
    if (!options?.explicitReset) {
      for (const prior of loadCandidates(slotId, existing.raws, existing.diagnostics)) {
        if (!prior.state) continue
        const regression = detectCatastrophicProgressRegression(prior.state, state)
        if (regression.catastrophic) {
          preserveSuspectSnapshot(slotId, encoded)
          return saveFailure(slotId, regression.reasons.join('; '), true, prior.source, regression, 'regression', serializedBytes)
        }
      }
    }

    const keys = storageKeys(slotId)
    previous = keys.map((key) => localStorage.getItem(key))
    transactionStarted = true
    if (options?.explicitReset) {
      keys.forEach((key) => localStorage.removeItem(key))
      localStorage.removeItem(profileSaveRecoveryKey(slotId))
      localStorage.removeItem(profileSaveSuspectKey(slotId))
      writeVerified(keys[0], encoded)
    } else {
      const suspectRaw = localStorage.getItem(profileSaveSuspectKey(slotId))
      const priorBySource = [
        { raw: existing.raws.primary, diagnostic: existing.diagnostics.primary },
        { raw: existing.raws.backup, diagnostic: existing.diagnostics.backup1 },
        { raw: existing.raws.backup2, diagnostic: existing.diagnostics.backup2 },
        { raw: existing.raws.backup3, diagnostic: existing.diagnostics.backup3 },
      ]
      const retained = priorBySource.filter(({ raw, diagnostic }) => Boolean(raw) && diagnostic.ok && raw !== encoded && raw !== suspectRaw).map(({ raw }) => raw!)
      const writeGeneration = (backupCount: number) => {
        writeVerified(keys[0], encoded)
        retained.slice(0, backupCount).forEach((value, index) => writeVerified(keys[index + 1], value))
        for (let index = backupCount + 1; index < keys.length; index += 1) writeVerified(keys[index], null)
      }
      try { writeGeneration(3) } catch (error) {
        if (!isQuotaError(error)) throw error
        for (const backupCount of [2, 1]) {
          try {
            writeVerified(keys[3], null)
            if (backupCount === 1) writeVerified(keys[2], null)
            writeGeneration(backupCount)
            break
          } catch (retryError) {
            if (!isQuotaError(retryError) || backupCount === 1) throw retryError
          }
        }
      }
    }
    recordSuccessfulSave(slotId, savedAt)
    return { ok: true, error: null, serializedBytes }
  } catch (error) {
    if (transactionStarted) {
      try {
        storageKeys(slotId).forEach((key) => localStorage.removeItem(key))
        storageKeys(slotId).forEach((key, index) => writeVerified(key, previous[index] ?? null))
      }
      catch (restoreError) { console.error('[profile-save] Save failed and previous storage could not be fully restored.', restoreError) }
    }
    return saveFailure(slotId, error instanceof Error ? error.message : 'Profile save could not be written.', false, undefined, undefined, isQuotaError(error) ? 'quota' : error instanceof Error && error.message.startsWith('Save write verification failed') ? 'write-verification' : 'unknown', serializedBytes)
  }
}

export const clearProfileGame = (slotId: ProfileSlotId): ProfileSaveResult => {
  if (!isProfileSlotId(slotId)) return { ok: false, error: 'Invalid profile slot.' }
  if (typeof localStorage === 'undefined') return { ok: false, error: 'Browser storage is unavailable.' }
  try {
    storageKeys(slotId).forEach((key) => localStorage.removeItem(key))
    localStorage.removeItem(profileSaveRecoveryKey(slotId))
    localStorage.removeItem(profileSaveSuspectKey(slotId))
    return { ok: true, error: null }
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Profile save could not be removed.' } }
}

/** Explicit user-confirmed reset path. Ordinary saves never bypass the guard. */
export const resetProfileGame = (slotId: ProfileSlotId, state: GameState, options?: { savedAt?: number }) => saveProfileGame(slotId, state, { ...options, explicitReset: true })
