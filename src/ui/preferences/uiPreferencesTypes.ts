export type UiTheme = 'default' | 'dark' | 'light' | 'custom'
export type TextSize = 'default' | 'large' | 'extra-large'
export type NavigationGroupId = 'combat' | 'hero' | 'tower' | 'world' | 'system'

export interface CustomThemeColors {
  background: string
  panel: string
  text: string
  muted: string
  accent: string
  secondary: string
  border: string
}

export interface UiPreferences {
  theme: UiTheme
  textSize: TextSize
  backgroundEffects: boolean
  reducedMotion: boolean
  customTheme: CustomThemeColors
  navigationGroups: Record<NavigationGroupId, boolean>
}
