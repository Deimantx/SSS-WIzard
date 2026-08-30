import { useSyncExternalStore } from 'react'
import { applyUiPreferences } from '../theme/themeManager'
import { defaultUiPreferences, loadUiPreferences, normalizeUiPreferences, resetUiPreferences, saveUiPreferences } from './uiPreferencesStorage'
import type { CustomThemeColors, ScreenPreferences, UiPreferences } from './uiPreferencesTypes'

let current = loadUiPreferences()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }

export const getUiPreferences = () => current
type TransmutationPreferenceChanges = Partial<Omit<ScreenPreferences['transmutation'], 'collapsedCategories'>> & { collapsedCategories?: Partial<ScreenPreferences['transmutation']['collapsedCategories']> }
type UiPreferenceChanges = Omit<Partial<UiPreferences>, 'screenState'> & { screenState?: { inventory?: Partial<ScreenPreferences['inventory']>; transmutation?: TransmutationPreferenceChanges; research?: Partial<ScreenPreferences['research']>; combat?: Partial<ScreenPreferences['combat']> } }

export const setUiPreferences = (changes: UiPreferenceChanges) => {
  const screenState = changes.screenState
  current = normalizeUiPreferences({
    ...current,
    ...changes,
    customTheme: changes.customTheme ? { ...current.customTheme, ...changes.customTheme } : current.customTheme,
    screenState: screenState ? { ...current.screenState, ...screenState, inventory: { ...current.screenState.inventory, ...screenState.inventory }, transmutation: { ...current.screenState.transmutation, ...screenState.transmutation, collapsedCategories: { ...current.screenState.transmutation.collapsedCategories, ...screenState.transmutation?.collapsedCategories } }, research: { ...current.screenState.research, ...screenState.research }, combat: { ...current.screenState.combat, ...screenState.combat } } : current.screenState,
  })
  saveUiPreferences(current)
  applyUiPreferences(current)
  emit()
  return current
}
export const setCustomThemeColor = (key: keyof CustomThemeColors, value: string) => setUiPreferences({ customTheme: { ...current.customTheme, [key]: value } })
export const resetAppearance = () => {
  const defaults = defaultUiPreferences()
  current = normalizeUiPreferences({ ...current, theme: defaults.theme, textSize: defaults.textSize, backgroundEffects: defaults.backgroundEffects, reducedMotion: defaults.reducedMotion, customTheme: defaults.customTheme })
  saveUiPreferences(current)
  applyUiPreferences(current)
  emit()
  return current
}
export const resetAllUiPreferences = () => { current = resetUiPreferences(); applyUiPreferences(current); emit(); return current }
export const resetCustomTheme = () => setUiPreferences({ customTheme: defaultUiPreferences().customTheme })
export const useUiPreferences = () => useSyncExternalStore(subscribe, () => current, () => current)
