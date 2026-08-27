import { customFromPreset, THEME_PRESETS } from '../theme/themePresets'
import { RECIPE_ORDER } from '../../game/content/recipes/recipes'
import { ITEMS } from '../../game/content/items/items'
import { SCHOOLS } from '../../game/content/schools/schools'
import type { ScreenPreferences, TransmutationLibraryFilter, UiPreferences } from './uiPreferencesTypes'

export const UI_PREFERENCES_KEY = 'sss-wizard-ui-preferences-v1'
export const defaultScreenPreferences = (): ScreenPreferences => ({
  inventory: { currentNeedsOpen: true, sourceOpen: false, usedInOpen: true },
  transmutation: { selectedRecipeId: RECIPE_ORDER[0], recipeFilter: 'all', usedInOpen: true, collapsedCategories: { elemental: false, material: false, equipment: false, special: false } },
  research: { selectedItemId: null, affinityFilter: 'all', targetSchoolId: 'fire' },
})

export const defaultUiPreferences = (): UiPreferences => ({ theme: 'default', textSize: 'default', backgroundEffects: true, reducedMotion: false, customTheme: customFromPreset(THEME_PRESETS.default), navigationGroups: { combat: false, hero: false, tower: false, world: false, system: false }, screenState: defaultScreenPreferences() })
const validColor = (value: unknown, fallback: string) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback

export const normalizeUiPreferences = (value: unknown): UiPreferences => {
  const defaults = defaultUiPreferences()
  if (!value || typeof value !== 'object') return defaults
  const input = value as Partial<UiPreferences>
  const inputCustom = (input.customTheme && typeof input.customTheme === 'object' ? input.customTheme : {}) as Partial<UiPreferences['customTheme']>
  const custom = { background: validColor(inputCustom.background, defaults.customTheme.background), panel: validColor(inputCustom.panel, defaults.customTheme.panel), text: validColor(inputCustom.text, defaults.customTheme.text), muted: validColor(inputCustom.muted, defaults.customTheme.muted), accent: validColor(inputCustom.accent, defaults.customTheme.accent), secondary: validColor(inputCustom.secondary, defaults.customTheme.secondary), border: validColor(inputCustom.border, defaults.customTheme.border) }
  const groups = (input.navigationGroups && typeof input.navigationGroups === 'object' ? input.navigationGroups : {}) as Partial<UiPreferences['navigationGroups']>
  const screenState = (input.screenState && typeof input.screenState === 'object' ? input.screenState : {}) as Partial<ScreenPreferences>
  const inventory = (screenState.inventory && typeof screenState.inventory === 'object' ? screenState.inventory : {}) as Partial<ScreenPreferences['inventory']>
  const transmutation = (screenState.transmutation && typeof screenState.transmutation === 'object' ? screenState.transmutation : {}) as Partial<ScreenPreferences['transmutation']>
  const research = (screenState.research && typeof screenState.research === 'object' ? screenState.research : {}) as Partial<ScreenPreferences['research']>
  const collapsedCategories = (transmutation.collapsedCategories && typeof transmutation.collapsedCategories === 'object' ? transmutation.collapsedCategories : {}) as Partial<ScreenPreferences['transmutation']['collapsedCategories']>
  const validFilters: TransmutationLibraryFilter[] = ['all', 'elemental', 'material', 'equipment', 'special', 'craftable', 'active']
  const recipeFilter = validFilters.includes(transmutation.recipeFilter as TransmutationLibraryFilter) ? transmutation.recipeFilter as TransmutationLibraryFilter : defaults.screenState.transmutation.recipeFilter
  const selectedRecipeId = typeof transmutation.selectedRecipeId === 'string' && RECIPE_ORDER.includes(transmutation.selectedRecipeId as (typeof RECIPE_ORDER)[number]) ? transmutation.selectedRecipeId : defaults.screenState.transmutation.selectedRecipeId
  const selectedItemId = typeof research.selectedItemId === 'string' && Boolean(ITEMS[research.selectedItemId as keyof typeof ITEMS]?.researchSchool) ? research.selectedItemId as keyof typeof ITEMS : null
  const affinityFilter = research.affinityFilter === 'fire' || research.affinityFilter === 'water' || research.affinityFilter === 'earth' || research.affinityFilter === 'air' ? research.affinityFilter : 'all'
  const targetSchoolId = research.targetSchoolId && SCHOOLS[research.targetSchoolId] ? research.targetSchoolId : defaults.screenState.research.targetSchoolId
  return { theme: input.theme === 'dark' || input.theme === 'light' || input.theme === 'custom' ? input.theme : 'default', textSize: input.textSize === 'large' || input.textSize === 'extra-large' ? input.textSize : 'default', backgroundEffects: input.backgroundEffects !== false, reducedMotion: input.reducedMotion === true, customTheme: custom, navigationGroups: { combat: groups.combat === true, hero: groups.hero === true, tower: groups.tower === true, world: groups.world === true, system: groups.system === true }, screenState: { inventory: { currentNeedsOpen: inventory.currentNeedsOpen !== false, sourceOpen: inventory.sourceOpen === true, usedInOpen: inventory.usedInOpen !== false }, transmutation: { selectedRecipeId, recipeFilter, usedInOpen: transmutation.usedInOpen !== false, collapsedCategories: { elemental: collapsedCategories.elemental === true, material: collapsedCategories.material === true, equipment: collapsedCategories.equipment === true, special: collapsedCategories.special === true } }, research: { selectedItemId, affinityFilter, targetSchoolId } } }
}

export const loadUiPreferences = (): UiPreferences => { try { const raw = window.localStorage.getItem(UI_PREFERENCES_KEY); return raw ? normalizeUiPreferences(JSON.parse(raw)) : defaultUiPreferences() } catch { return defaultUiPreferences() } }
export const saveUiPreferences = (preferences: UiPreferences) => { try { window.localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(preferences)) } catch { /* Storage can be unavailable in private contexts. */ } }
export const resetUiPreferences = () => { const preferences = defaultUiPreferences(); saveUiPreferences(preferences); return preferences }
