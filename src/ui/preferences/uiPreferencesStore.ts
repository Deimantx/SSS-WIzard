import { useSyncExternalStore } from 'react'
import { applyUiPreferences } from '../theme/themeManager'
import { defaultUiPreferences, loadUiPreferences, normalizeUiPreferences, resetUiPreferences, saveUiPreferences } from './uiPreferencesStorage'
import type { CustomThemeColors, UiPreferences } from './uiPreferencesTypes'

let current = loadUiPreferences()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }

export const getUiPreferences = () => current
export const setUiPreferences = (changes: Partial<UiPreferences>) => { current = normalizeUiPreferences({ ...current, ...changes, customTheme: changes.customTheme ? { ...current.customTheme, ...changes.customTheme } : current.customTheme }); saveUiPreferences(current); applyUiPreferences(current); emit(); return current }
export const setCustomThemeColor = (key: keyof CustomThemeColors, value: string) => setUiPreferences({ customTheme: { ...current.customTheme, [key]: value } })
export const resetAppearance = () => { current = resetUiPreferences(); applyUiPreferences(current); emit(); return current }
export const resetCustomTheme = () => setUiPreferences({ customTheme: defaultUiPreferences().customTheme })
export const useUiPreferences = () => useSyncExternalStore(subscribe, () => current, () => current)
