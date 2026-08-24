import { customFromPreset, THEME_PRESETS } from '../theme/themePresets'
import type { UiPreferences } from './uiPreferencesTypes'

export const UI_PREFERENCES_KEY = 'sss-wizard-ui-preferences-v1'
export const defaultUiPreferences = (): UiPreferences => ({ theme: 'default', textSize: 'default', backgroundEffects: true, reducedMotion: false, customTheme: customFromPreset(THEME_PRESETS.default), navigationGroups: { combat: false, hero: false, tower: false, world: false, system: false } })
const validColor = (value: unknown, fallback: string) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback

export const normalizeUiPreferences = (value: unknown): UiPreferences => {
  const defaults = defaultUiPreferences()
  if (!value || typeof value !== 'object') return defaults
  const input = value as Partial<UiPreferences>
  const inputCustom = (input.customTheme && typeof input.customTheme === 'object' ? input.customTheme : {}) as Partial<UiPreferences['customTheme']>
  const custom = { background: validColor(inputCustom.background, defaults.customTheme.background), panel: validColor(inputCustom.panel, defaults.customTheme.panel), text: validColor(inputCustom.text, defaults.customTheme.text), muted: validColor(inputCustom.muted, defaults.customTheme.muted), accent: validColor(inputCustom.accent, defaults.customTheme.accent), secondary: validColor(inputCustom.secondary, defaults.customTheme.secondary), border: validColor(inputCustom.border, defaults.customTheme.border) }
  const groups = (input.navigationGroups && typeof input.navigationGroups === 'object' ? input.navigationGroups : {}) as Partial<UiPreferences['navigationGroups']>
  return { theme: input.theme === 'dark' || input.theme === 'light' || input.theme === 'custom' ? input.theme : 'default', textSize: input.textSize === 'large' || input.textSize === 'extra-large' ? input.textSize : 'default', backgroundEffects: input.backgroundEffects !== false, reducedMotion: input.reducedMotion === true, customTheme: custom, navigationGroups: { combat: groups.combat === true, hero: groups.hero === true, tower: groups.tower === true, world: groups.world === true, system: groups.system === true } }
}

export const loadUiPreferences = (): UiPreferences => { try { const raw = window.localStorage.getItem(UI_PREFERENCES_KEY); return raw ? normalizeUiPreferences(JSON.parse(raw)) : defaultUiPreferences() } catch { return defaultUiPreferences() } }
export const saveUiPreferences = (preferences: UiPreferences) => { try { window.localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(preferences)) } catch { /* Storage can be unavailable in private contexts. */ } }
export const resetUiPreferences = () => { const preferences = defaultUiPreferences(); saveUiPreferences(preferences); return preferences }
