import { useSyncExternalStore } from 'react'
import type { ProfileSlotId } from '../profiles/profileTypes'

export type SaveHealth = 'healthy' | 'recovered' | 'protected' | 'error'

export interface SaveDiagnosticsState {
  activeProfileId: ProfileSlotId | null
  health: SaveHealth
  lastSuccessfulSaveAt: number | null
  lastFailure: string | null
  lastRegressionFailure: string | null
}

const initialState: SaveDiagnosticsState = {
  activeProfileId: null,
  health: 'healthy',
  lastSuccessfulSaveAt: null,
  lastFailure: null,
  lastRegressionFailure: null,
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
  current = { ...current, activeProfileId, health: 'healthy', lastSuccessfulSaveAt: savedAt, lastFailure: null, lastRegressionFailure: null }
  emit()
}

export const recordRecoveredProfile = (activeProfileId: ProfileSlotId) => {
  current = { ...current, activeProfileId, health: 'recovered' }
  emit()
}

export const recordSaveFailure = (activeProfileId: ProfileSlotId, error: string, regression = false) => {
  current = { ...current, activeProfileId, health: regression ? 'protected' : 'error', lastFailure: error, ...(regression ? { lastRegressionFailure: error } : {}) }
  emit()
}

export const clearSaveDiagnostics = () => {
  current = initialState
  emit()
}
