import type { CustomThemeColors, UiTheme } from '../preferences/uiPreferencesTypes'

export interface ThemeColors extends CustomThemeColors {
  backgroundElevated: string
  sidebar: string
  topbar: string
  panelStrong: string
  panelHover: string
  borderStrong: string
  textDisabled: string
  accentStrong: string
  accentSoft: string
  gold: string
  danger: string
  success: string
  warning: string
  shadow: string
  panelGradientStart: string
  panelGradientEnd: string
}

export interface ThemePreset extends ThemeColors { id: Exclude<UiTheme, 'custom'>; label: string; description: string }
