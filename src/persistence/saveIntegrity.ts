import type { GameState } from '../game/types'
import { migrateSave, normalizeLegacyProgressEvidence } from './migrations'
import { CURRENT_SAVE_VERSION, isRecord } from './saveSchema'

export interface CriticalSaveSnapshot {
  inventory: GameState['inventory']
  protectedItems: GameState['protectedItems']
  equipment: GameState['equipment']
  schools: GameState['schools']
  currencies: GameState['currencies']
  activities: {
    channeling: GameState['activities']['channeling']
    research: GameState['activities']['research']
    transmutation: GameState['activities']['transmutation']
    autoCast: GameState['activities']['autoCast']
  }
  progress: GameState['progress']
  offlineBankMs: number
}

export interface SaveValidationResult {
  ok: boolean
  state: GameState | null
  error: string | null
}

export interface SaveRecoveryResult {
  state: GameState | null
  error: string | null
}

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Stable ordering makes the comparison semantic rather than dependent on object insertion order. */
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
  return value
}

export const getCriticalSaveSnapshot = (state: Pick<GameState, 'inventory' | 'protectedItems' | 'equipment' | 'schools' | 'currencies' | 'activities' | 'progress' | 'offlineBankMs'>): CriticalSaveSnapshot => cloneJson({
  inventory: state.inventory,
  protectedItems: state.protectedItems,
  equipment: state.equipment,
  schools: state.schools,
  currencies: state.currencies,
  activities: {
    channeling: state.activities.channeling,
    research: state.activities.research,
    transmutation: state.activities.transmutation,
    autoCast: state.activities.autoCast,
  },
  progress: (() => {
    const progress = cloneJson(state.progress)
    normalizeLegacyProgressEvidence(progress)
    return progress
  })(),
  offlineBankMs: state.offlineBankMs,
})

export const criticalSaveSnapshotsEqual = (left: CriticalSaveSnapshot, right: CriticalSaveSnapshot) => JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right))

export const validateSerializedSave = (encoded: string, expectedState?: GameState): SaveValidationResult => {
  try {
    const roundTripped = migrateSave(JSON.parse(encoded))
    if (expectedState && !criticalSaveSnapshotsEqual(getCriticalSaveSnapshot(expectedState), getCriticalSaveSnapshot(roundTripped))) {
      return { ok: false, state: null, error: 'Critical gameplay data changed during save round-trip.' }
    }
    return { ok: true, state: roundTripped, error: null }
  } catch (error) {
    return { ok: false, state: null, error: error instanceof Error ? error.message : 'Save data could not be validated.' }
  }
}

const decodeSave = (encoded: string): Record<string, unknown> => {
  const decoded: unknown = JSON.parse(encoded)
  if (!isRecord(decoded)) throw new Error('Save data is not a valid object.')
  if (typeof decoded.saveVersion !== 'number' || !Number.isInteger(decoded.saveVersion)) throw new Error('Save data is missing a valid saveVersion.')
  return decoded
}

const hasCurrentSaveShape = (value: Record<string, unknown>) => {
  const requiredKeys = ['player', 'schools', 'currencies', 'inventory', 'protectedItems', 'equipment', 'activities', 'progress', 'offlineBankMs', 'lastSavedAt']
  return requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
    && typeof value.lastSavedAt === 'number'
    && Number.isFinite(value.lastSavedAt)
    && value.lastSavedAt >= 0
    && isRecord(value.progress)
    && Object.prototype.hasOwnProperty.call(value.progress, 'spellRanks')
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
    if (decoded.saveVersion === CURRENT_SAVE_VERSION && !hasCurrentSaveShape(decoded)) {
      return { ok: false, state: null, error: 'Current save is missing required gameplay data.' }
    }
    if (decoded.saveVersion === CURRENT_SAVE_VERSION - 1 && !hasRecoverableSaveShape(decoded)) {
      return { ok: false, state: null, error: 'Historical save is missing required gameplay data.' }
    }
    const migrated = migrateSave(decoded)
    const roundTrip = validateSerializedSave(JSON.stringify(migrated), migrated)
    if (!roundTrip.ok) return roundTrip
    return { ok: true, state: migrated, error: null }
  } catch (error) {
    return { ok: false, state: null, error: error instanceof Error ? error.message : 'Save data could not be validated.' }
  }
}

/**
 * Controlled fallback for a historical document that the normal stored-save
 * path rejected. Migration is still required, and the canonical second pass
 * must preserve all critical gameplay data before the candidate is accepted.
 */
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
