import { loadUiPreferences } from '../preferences/uiPreferencesStorage'
import type { UiPreferences } from '../preferences/uiPreferencesTypes'
import { themeColors } from './themePresets'

const INLINE_VARIABLES = ['--ui-bg', '--ui-bg-elevated', '--ui-sidebar', '--ui-topbar', '--ui-panel', '--ui-panel-strong', '--ui-panel-hover', '--ui-border', '--ui-border-strong', '--ui-text', '--ui-text-soft', '--ui-text-muted', '--ui-text-disabled', '--ui-accent', '--ui-accent-strong', '--ui-accent-soft', '--ui-secondary', '--ui-shadow', '--ui-panel-gradient-start', '--ui-panel-gradient-end']

export const applyUiPreferences = (preferences: UiPreferences) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const colors = themeColors(preferences.theme, preferences.customTheme)
  root.dataset.theme = preferences.theme
  root.dataset.textSize = preferences.textSize
  root.dataset.reducedMotion = preferences.reducedMotion ? 'true' : 'false'
  root.dataset.customCursor = preferences.customCursor ? 'true' : 'false'
  INLINE_VARIABLES.forEach((variable) => root.style.removeProperty(variable))
  if (preferences.theme === 'custom') {
    const values: Record<string, string> = { '--ui-bg': colors.background, '--ui-bg-elevated': colors.backgroundElevated, '--ui-sidebar': colors.sidebar, '--ui-topbar': colors.topbar, '--ui-panel': colors.panel, '--ui-panel-strong': colors.panelStrong, '--ui-panel-hover': colors.panelHover, '--ui-border': colors.border, '--ui-border-strong': colors.borderStrong, '--ui-text': colors.text, '--ui-text-soft': colors.text, '--ui-text-muted': colors.muted, '--ui-text-disabled': colors.textDisabled, '--ui-accent': colors.accent, '--ui-accent-strong': colors.accentStrong, '--ui-accent-soft': colors.accentSoft, '--ui-secondary': colors.secondary, '--ui-shadow': colors.shadow, '--ui-panel-gradient-start': colors.panelGradientStart, '--ui-panel-gradient-end': colors.panelGradientEnd }
    Object.entries(values).forEach(([variable, value]) => root.style.setProperty(variable, value))
  }
}

export const applyStoredUiPreferences = () => { const preferences = loadUiPreferences(); applyUiPreferences(preferences); return preferences }
