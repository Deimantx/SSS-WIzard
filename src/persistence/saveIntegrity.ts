import type { GameState } from '../game/types'
import { migrateSave } from './migrations'
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
  progress: state.progress,
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

const hasCurrentSaveShape = (value: Record<string, unknown>) => {
  const requiredKeys = ['player', 'schools', 'currencies', 'inventory', 'protectedItems', 'equipment', 'activities', 'progress', 'offlineBankMs', 'lastSavedAt']
  return requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
    && typeof value.lastSavedAt === 'number'
    && Number.isFinite(value.lastSavedAt)
    && value.lastSavedAt >= 0
}

/** Validates a stored document without accepting a partial V9 object as a fresh save. */
export const validateStoredSave = (encoded: string): SaveValidationResult => {
  try {
    const decoded: unknown = JSON.parse(encoded)
    if (!isRecord(decoded)) return { ok: false, state: null, error: 'Save data is not a valid object.' }
    if (decoded.saveVersion === CURRENT_SAVE_VERSION && !hasCurrentSaveShape(decoded)) {
      return { ok: false, state: null, error: 'Current save is missing required gameplay data.' }
    }
    const migrated = migrateSave(decoded)
    const roundTrip = validateSerializedSave(JSON.stringify(migrated))
    if (!roundTrip.ok) return roundTrip
    return { ok: true, state: migrated, error: null }
  } catch (error) {
    return { ok: false, state: null, error: error instanceof Error ? error.message : 'Save data could not be validated.' }
  }
}
