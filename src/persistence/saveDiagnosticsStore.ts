import { useSyncExternalStore } from 'react'
import type { ProfileSlotId } from '../profiles/profileTypes'
import type { SaveValidationReport } from './saveIntegrity'

export type SaveHealth = 'healthy' | 'recovered' | 'error'
export type SaveFailureKind = 'quota' | 'storage-unavailable' | 'serialization' | 'validation' | 'write-verification' | 'unknown'

export interface SaveDiagnosticsState {
  activeProfileId: ProfileSlotId | null
  health: SaveHealth
  lastSuccessfulSaveAt: number | null
  lastFailure: string | null
  lastFailureKind: SaveFailureKind | null
  lastFailureDetail: string | null
  lastFailureSerializedBytes: number | null
  lastValidationReport: SaveValidationReport | null
}

const initialState: SaveDiagnosticsState = {
  activeProfileId: null,
  health: 'healthy',
  lastSuccessfulSaveAt: null,
  lastFailure: null,
  lastFailureKind: null,
  lastFailureDetail: null,
  lastFailureSerializedBytes: null,
  lastValidationReport: null,
}

let current = initialState
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

export const getSaveDiagnostics = () => current
export const useSaveDiagnosticsStore = () => useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener) }, () => current, () => current)

export const setSaveDiagnosticsProfile = (activeProfileId: ProfileSlotId | null) => {
  current = { ...current, activeProfileId }
  emit()
}

export const recordSuccessfulSave = (activeProfileId: ProfileSlotId, savedAt: number) => {
  current = { ...current, activeProfileId, health: 'healthy', lastSuccessfulSaveAt: savedAt, lastFailure: null, lastFailureKind: null, lastFailureDetail: null, lastFailureSerializedBytes: null, lastValidationReport: null }
  emit()
}

export const recordRecoveredProfile = (activeProfileId: ProfileSlotId) => {
  current = { ...current, activeProfileId, health: 'recovered' }
  emit()
}

export const recordSaveFailure = (activeProfileId: ProfileSlotId, error: string, details?: { kind?: SaveFailureKind; detail?: string; serializedBytes?: number; validationReport?: SaveValidationReport }) => {
  current = { ...current, activeProfileId, health: 'error', lastFailure: error, lastFailureKind: details?.kind ?? 'unknown', lastFailureDetail: details?.detail ?? null, lastFailureSerializedBytes: details?.serializedBytes ?? null, lastValidationReport: details?.validationReport ?? null }
  emit()
}

export const clearSaveDiagnostics = () => {
  current = initialState
  emit()
}
