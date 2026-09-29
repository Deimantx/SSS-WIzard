import type { GameState } from '../game/types'
import { parsePersistedGameStateV1, validatePersistedGameStateV1 } from './v2/saveSchema'
import { serializeGameStateV1 } from './v2/saveSerializer'
import { loadPersistedGameStateV1 } from './v2/saveLoader'
import { validateV2RoundTrip } from './v2/saveRoundTrip'

export type SaveValidationClassification = 'MATCH' | 'DERIVED_ONLY' | 'AUTHORITATIVE_CHANGE' | 'STRUCTURAL_INVALID'
export interface SaveValidationChange { path: string; before: unknown; after: unknown; classification: Exclude<SaveValidationClassification, 'MATCH' | 'STRUCTURAL_INVALID'> }
export interface SaveValidationReport { classification: SaveValidationClassification; changes: SaveValidationChange[]; summary: string }
export interface SaveValidationResult { ok: boolean; state: GameState | null; error: string | null; report: SaveValidationReport }

export const getAuthoritativeSaveSnapshot = (state: GameState) => serializeGameStateV1(state)
export const getCriticalSaveSnapshot = getAuthoritativeSaveSnapshot
export type AuthoritativeSaveSnapshot = ReturnType<typeof getAuthoritativeSaveSnapshot>
export type CriticalSaveSnapshot = AuthoritativeSaveSnapshot
export const criticalSaveSnapshotsEqual = (left: AuthoritativeSaveSnapshot, right: AuthoritativeSaveSnapshot) => JSON.stringify(left) === JSON.stringify(right)

export const validateSerializedSave = (encoded: string, expectedState?: GameState): SaveValidationResult => {
  if (expectedState) return validateV2RoundTrip(encoded, expectedState)
  try {
    const parsed = parsePersistedGameStateV1(encoded)
    const state = loadPersistedGameStateV1(parsed)
    return { ok: true, state, error: null, report: { classification: 'MATCH', changes: [], summary: 'V2 save schema is valid.' } }
  } catch (error) {
    return { ok: false, state: null, error: error instanceof Error ? error.message : 'Save data could not be validated.', report: { classification: 'STRUCTURAL_INVALID', changes: [], summary: 'Save data does not match the V2 schema.' } }
  }
}

export const validateStoredSave = (encoded: string) => validateSerializedSave(encoded)
export const isPersistedSaveV1 = validatePersistedGameStateV1
