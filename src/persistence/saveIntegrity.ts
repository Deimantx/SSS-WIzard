import type { GameState } from '../game/types'
import { migrateSave, normalizeLegacyProgressEvidence } from './migrations'
import { CURRENT_SAVE_VERSION, isRecord } from './saveSchema'

export type SaveValidationClassification = 'MATCH' | 'DERIVED_ONLY' | 'AUTHORITATIVE_CHANGE' | 'STRUCTURAL_INVALID'

export interface SaveValidationChange {
  path: string
  before: unknown
  after: unknown
  classification: Exclude<SaveValidationClassification, 'MATCH' | 'STRUCTURAL_INVALID'>
}

export interface SaveValidationReport {
  classification: SaveValidationClassification
  changes: SaveValidationChange[]
  summary: string
}

/** Explicit allow-list of player-owned and progression-bearing save data. */
export interface AuthoritativeSaveSnapshot {
  inventory: GameState['inventory']
  crystals: GameState['crystals']
  protectedItems: GameState['protectedItems']
  equipment: GameState['equipment']
  artifactProgress: GameState['artifactProgress']
  arcaneCore: GameState['arcaneCore']
  sigils: GameState['sigils']
  guardians: GameState['guardians']
  schools: GameState['schools']
  currencies: GameState['currencies']
  resonance: GameState['resonance']
  worldTier: GameState['worldTier']
  tower: GameState['tower']
  activities: {
    channeling: GameState['activities']['channeling']
    research: GameState['activities']['research']
    transmutation: GameState['activities']['transmutation']
    artificing: GameState['activities']['artificing']
    autoCast: GameState['activities']['autoCast']
  }
  progress: Omit<GameState['progress'], 'chronicle'>
  storyProgress: GameState['storyProgress']
  darkPortal: GameState['darkPortal']
  spellPresets: GameState['spellPresets']
  offlineBankMs: number
  targetEnemyId: GameState['combat']['targetEnemyId']
  dungeonSequenceIndex: GameState['combat']['dungeonSequenceIndex']
  combatRngState: number
}

/** Compatibility name retained for existing diagnostics/tests. */
export type CriticalSaveSnapshot = AuthoritativeSaveSnapshot

export interface SaveValidationResult {
  ok: boolean
  state: GameState | null
  error: string | null
  report: SaveValidationReport
}

export interface SaveRecoveryResult {
  state: GameState | null
  error: string | null
}

const emptyReport = (): SaveValidationReport => ({ classification: 'MATCH', changes: [], summary: 'Authoritative save data matches after migration.' })
const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Stable ordering makes the comparison semantic rather than insertion-order dependent. */
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
  return value
}

const normalizeProgress = (value: GameState['progress']) => {
  const progress = cloneJson(value)
  normalizeLegacyProgressEvidence(progress)
  const { chronicle: _derivedChronicle, ...authoritativeProgress } = progress
  return authoritativeProgress
}

export const getAuthoritativeSaveSnapshot = (state: GameState): AuthoritativeSaveSnapshot => cloneJson({
  inventory: state.inventory,
  crystals: state.crystals,
  protectedItems: state.protectedItems,
  equipment: state.equipment,
  artifactProgress: state.artifactProgress,
  arcaneCore: state.arcaneCore,
  sigils: state.sigils,
  guardians: state.guardians,
  schools: state.schools,
  currencies: state.currencies,
  resonance: state.resonance,
  worldTier: state.worldTier,
  tower: state.tower,
  activities: {
    channeling: state.activities.channeling,
    research: state.activities.research,
    transmutation: state.activities.transmutation,
    artificing: state.activities.artificing,
    autoCast: state.activities.autoCast,
  },
  progress: normalizeProgress(state.progress),
  storyProgress: state.storyProgress,
  darkPortal: state.darkPortal,
  spellPresets: state.spellPresets,
  offlineBankMs: state.offlineBankMs,
  targetEnemyId: state.combat.targetEnemyId,
  dungeonSequenceIndex: state.combat.dungeonSequenceIndex,
  combatRngState: state.combat.combatRngState,
})

export const getCriticalSaveSnapshot = getAuthoritativeSaveSnapshot
export const criticalSaveSnapshotsEqual = (left: AuthoritativeSaveSnapshot, right: AuthoritativeSaveSnapshot) => JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right))

const pathFor = (path: string, key: string | number) => path ? `${path}.${String(key)}` : String(key)

const collectDiffs = (before: unknown, after: unknown, path: string, changes: SaveValidationChange[], classification: SaveValidationChange['classification']) => {
  if (changes.length >= 50) return
  if (JSON.stringify(canonicalize(before)) === JSON.stringify(canonicalize(after))) return
  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length)
    for (let index = 0; index < length && changes.length < 50; index += 1) collectDiffs(before[index], after[index], pathFor(path, index), changes, classification)
    return
  }
  if (isRecord(before) && isRecord(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)].sort())
    for (const key of keys) if (changes.length < 50) collectDiffs(before[key], after[key], pathFor(path, key), changes, classification)
    return
  }
  changes.push({ path: path || '$', before, after, classification })
}

const getDerivedSnapshot = (state: GameState) => ({ chronicle: state.progress.chronicle })

const buildValidationReport = (expected: GameState, actual: GameState): SaveValidationReport => {
  const authoritativeChanges: SaveValidationChange[] = []
  collectDiffs(getAuthoritativeSaveSnapshot(expected), getAuthoritativeSaveSnapshot(actual), '', authoritativeChanges, 'AUTHORITATIVE_CHANGE')
  if (authoritativeChanges.length) return {
    classification: 'AUTHORITATIVE_CHANGE',
    changes: authoritativeChanges,
    summary: `${authoritativeChanges.length}${authoritativeChanges.length === 50 ? '+' : ''} authoritative field${authoritativeChanges.length === 1 ? '' : 's'} changed during migration.`,
  }
  const derivedChanges: SaveValidationChange[] = []
  collectDiffs(getDerivedSnapshot(expected), getDerivedSnapshot(actual), '', derivedChanges, 'DERIVED_ONLY')
  return derivedChanges.length
    ? { classification: 'DERIVED_ONLY', changes: derivedChanges, summary: `${derivedChanges.length} derived field${derivedChanges.length === 1 ? '' : 's'} normalized during migration.` }
    : emptyReport()
}

export const validateSerializedSave = (encoded: string, expectedState?: GameState): SaveValidationResult => {
  try {
    const roundTripped = migrateSave(JSON.parse(encoded))
    const report = expectedState ? buildValidationReport(expectedState, roundTripped) : emptyReport()
    if (report.classification === 'AUTHORITATIVE_CHANGE') {
      const paths = report.changes.map((change) => change.path).join(', ')
      return { ok: false, state: null, error: `Critical gameplay data changed during save round-trip: ${paths}.`, report }
    }
    return { ok: true, state: roundTripped, error: null, report }
  } catch (error) {
    return {
      ok: false,
      state: null,
      error: error instanceof Error ? error.message : 'Save data could not be validated.',
      report: { classification: 'STRUCTURAL_INVALID', changes: [], summary: 'Save data could not be migrated into a valid profile state.' },
    }
  }
}

const decodeSave = (encoded: string): Record<string, unknown> => {
  const decoded: unknown = JSON.parse(encoded)
  if (!isRecord(decoded)) throw new Error('Save data is not a valid object.')
  if (typeof decoded.saveVersion !== 'number' || !Number.isInteger(decoded.saveVersion)) throw new Error('Save data is missing a valid saveVersion.')
  return decoded
}

const hasCurrentSaveShape = (value: Record<string, unknown>) => {
  const requiredKeys = ['player', 'schools', 'currencies', 'resonance', 'worldTier', 'inventory', 'crystals', 'protectedItems', 'equipment', 'artifactProgress', 'sigils', 'guardians', 'activities', 'combat', 'progress', 'storyProgress', 'darkPortal', 'offlineBankMs', 'lastSavedAt']
  return requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
    && typeof value.lastSavedAt === 'number'
    && Number.isFinite(value.lastSavedAt)
    && value.lastSavedAt >= 0
    && isRecord(value.progress)
    && Object.prototype.hasOwnProperty.call(value.progress, 'spellRanks')
    && isRecord(value.combat)
    && Object.prototype.hasOwnProperty.call(value.combat, 'dungeonSequenceIndex')
    && Object.prototype.hasOwnProperty.call(value, 'spellPresets')
}

const hasRecoverableSaveShape = (value: Record<string, unknown>) => {
  // Recovery may repair a missing current-only field such as lastSavedAt, but
  // it must never turn a version marker or tiny partial object into a fresh save.
  const requiredKeys = ['player', 'schools', 'inventory', 'protectedItems', 'equipment', 'activities', 'progress', 'offlineBankMs']
  return requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
}

/** Validates a stored document without accepting a partial current object as a fresh save. */
export const validateStoredSave = (encoded: string): SaveValidationResult => {
  try {
    const decoded = decodeSave(encoded)
    const saveVersion = decoded.saveVersion as number
    if (saveVersion === CURRENT_SAVE_VERSION && !hasCurrentSaveShape(decoded)) {
      return { ok: false, state: null, error: 'Current save is missing required gameplay data.', report: { classification: 'STRUCTURAL_INVALID', changes: [], summary: 'Current save is missing required gameplay data.' } }
    }
    if (saveVersion < CURRENT_SAVE_VERSION && !hasRecoverableSaveShape(decoded)) {
      return { ok: false, state: null, error: 'Historical save is missing required gameplay data.', report: { classification: 'STRUCTURAL_INVALID', changes: [], summary: 'Historical save is missing required gameplay data.' } }
    }
    const migrated = migrateSave(decoded)
    const roundTrip = validateSerializedSave(JSON.stringify(migrated), migrated)
    if (!roundTrip.ok) return roundTrip
    return { ok: true, state: migrated, error: null, report: roundTrip.report }
  } catch (error) {
    return { ok: false, state: null, error: error instanceof Error ? error.message : 'Save data could not be validated.', report: { classification: 'STRUCTURAL_INVALID', changes: [], summary: 'Save data could not be validated.' } }
  }
}

/** Controlled fallback for a historical document rejected by the normal path. */
export const attemptLegacySaveRecovery = (encoded: string): SaveRecoveryResult => {
  try {
    const decoded = decodeSave(encoded)
    if (!hasRecoverableSaveShape(decoded)) return { state: null, error: 'Save data does not contain enough gameplay data for safe recovery.' }
    const migrated = migrateSave(decoded)
    const canonical = validateSerializedSave(JSON.stringify(migrated), migrated)
    if (!canonical.ok || !canonical.state) return { state: null, error: canonical.error ?? 'Critical gameplay data changed during recovery.' }
    return { state: canonical.state, error: null }
  } catch (error) {
    return { state: null, error: error instanceof Error ? error.message : 'Legacy save recovery failed.' }
  }
}
