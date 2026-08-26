import { useSyncExternalStore } from 'react'
import { applyUiPreferences } from '../theme/themeManager'
import { defaultUiPreferences, loadUiPreferences, normalizeUiPreferences, resetUiPreferences, saveUiPreferences } from './uiPreferencesStorage'
import type { CustomThemeColors, ScreenPreferences, UiPreferences } from './uiPreferencesTypes'

let current = loadUiPreferences()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }

export const getUiPreferences = () => current
type UiPreferenceChanges = Omit<Partial<UiPreferences>, 'screenState'> & { screenState?: { inventory?: Partial<ScreenPreferences['inventory']>; transmutation?: Partial<ScreenPreferences['transmutation']> } }

export const setUiPreferences = (changes: UiPreferenceChanges) => {
  const screenState = changes.screenState
  current = normalizeUiPreferences({
    ...current,
    ...changes,
    customTheme: changes.customTheme ? { ...current.customTheme, ...changes.customTheme } : current.customTheme,
    screenState: screenState ? { ...current.screenState, ...screenState, inventory: { ...current.screenState.inventory, ...screenState.inventory }, transmutation: { ...current.screenState.transmutation, ...screenState.transmutation } } : current.screenState,
  })
  saveUiPreferences(current)
  applyUiPreferences(current)
  emit()
  return current
}
export const setCustomThemeColor = (key: keyof CustomThemeColors, value: string) => setUiPreferences({ customTheme: { ...current.customTheme, [key]: value } })
export const resetAppearance = () => { current = resetUiPreferences(); applyUiPreferences(current); emit(); return current }
export const resetCustomTheme = () => setUiPreferences({ customTheme: defaultUiPreferences().customTheme })
export const useUiPreferences = () => useSyncExternalStore(subscribe, () => current, () => current)
