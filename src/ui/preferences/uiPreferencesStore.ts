import { useSyncExternalStore } from 'react'
import { applyUiPreferences } from '../theme/themeManager'
import { defaultUiPreferences, loadUiPreferences, normalizeUiPreferences, resetUiPreferences, saveUiPreferences } from './uiPreferencesStorage'
import { MAX_ARTIFICING_RECIPE_PINS } from './uiPreferencesTypes'
import type { ArtificingRecipeId } from '../../game/types'
import type { CustomThemeColors, ScreenPreferences, UiPreferences } from './uiPreferencesTypes'
import { ARTIFICING_RECIPE_ORDER } from '../../game/content/recipes/artificingRecipes'

let current = loadUiPreferences()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }

export const getUiPreferences = () => current
type LegacyRecipeFilter = 'all' | 'elemental' | 'material' | 'equipment' | 'special' | 'craftable' | 'active'
type TransmutationPreferenceChanges = Partial<Omit<ScreenPreferences['transmutation'], 'collapsedCategories'>> & { collapsedCategories?: Partial<ScreenPreferences['transmutation']['collapsedCategories']>; /** @deprecated Loaded and normalized only for pre-V2 preference compatibility. */ recipeFilter?: LegacyRecipeFilter }
type UiPreferenceChanges = Omit<Partial<UiPreferences>, 'screenState'> & { screenState?: { inventory?: Partial<ScreenPreferences['inventory']>; transmutation?: TransmutationPreferenceChanges; artificing?: Partial<NonNullable<ScreenPreferences['artificing']>>; research?: Partial<ScreenPreferences['research']>; combat?: Partial<ScreenPreferences['combat']> } }

export const setUiPreferences = (changes: UiPreferenceChanges) => {
  const screenState = changes.screenState
  current = normalizeUiPreferences({
    ...current,
    ...changes,
    customTheme: changes.customTheme ? { ...current.customTheme, ...changes.customTheme } : current.customTheme,
    screenState: screenState ? { ...current.screenState, ...screenState, inventory: { ...current.screenState.inventory, ...screenState.inventory }, transmutation: { ...current.screenState.transmutation, ...screenState.transmutation, collapsedCategories: { ...current.screenState.transmutation.collapsedCategories, ...screenState.transmutation?.collapsedCategories } }, artificing: { ...current.screenState.artificing, ...screenState.artificing }, research: { ...current.screenState.research, ...screenState.research }, combat: { ...current.screenState.combat, ...screenState.combat } } : current.screenState,
  })
  saveUiPreferences(current)
  applyUiPreferences(current)
  emit()
  return current
}
export const isArtificingRecipePinned = (recipeId: ArtificingRecipeId) => current.screenState.artificing.pinnedRecipeIds.includes(recipeId)
export const canPinArtificingRecipe = (recipeId: ArtificingRecipeId) => ARTIFICING_RECIPE_ORDER.includes(recipeId) && (isArtificingRecipePinned(recipeId) || current.screenState.artificing.pinnedRecipeIds.length < MAX_ARTIFICING_RECIPE_PINS)
export const pinArtificingRecipe = (recipeId: ArtificingRecipeId) => {
  if (!ARTIFICING_RECIPE_ORDER.includes(recipeId) || isArtificingRecipePinned(recipeId) || current.screenState.artificing.pinnedRecipeIds.length >= MAX_ARTIFICING_RECIPE_PINS) return false
  setUiPreferences({ screenState: { artificing: { pinnedRecipeIds: [...current.screenState.artificing.pinnedRecipeIds, recipeId] } } })
  return true
}
export const unpinArtificingRecipe = (recipeId: ArtificingRecipeId) => {
  if (!isArtificingRecipePinned(recipeId)) return false
  setUiPreferences({ screenState: { artificing: { pinnedRecipeIds: current.screenState.artificing.pinnedRecipeIds.filter((id) => id !== recipeId) } } })
  return true
}
export const toggleArtificingRecipePin = (recipeId: ArtificingRecipeId) => isArtificingRecipePinned(recipeId) ? unpinArtificingRecipe(recipeId) : pinArtificingRecipe(recipeId)
export const setCustomThemeColor = (key: keyof CustomThemeColors, value: string) => setUiPreferences({ customTheme: { ...current.customTheme, [key]: value } })
export const resetAppearance = () => {
  const defaults = defaultUiPreferences()
  current = normalizeUiPreferences({ ...current, theme: defaults.theme, textSize: defaults.textSize, backgroundEffects: defaults.backgroundEffects, reducedMotion: defaults.reducedMotion, customCursor: defaults.customCursor, showFpsCounter: defaults.showFpsCounter, uiSounds: defaults.uiSounds, uiSoundVolume: defaults.uiSoundVolume, customTheme: defaults.customTheme })
  saveUiPreferences(current)
  applyUiPreferences(current)
  emit()
  return current
}
export const resetAllUiPreferences = () => { current = resetUiPreferences(); applyUiPreferences(current); emit(); return current }
export const resetCustomTheme = () => setUiPreferences({ customTheme: defaultUiPreferences().customTheme })
export const useUiPreferences = () => useSyncExternalStore(subscribe, () => current, () => current)
