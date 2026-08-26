import type { RecipeCategory } from '../../game/types'

export type UiTheme = 'default' | 'dark' | 'light' | 'custom'
export type TextSize = 'default' | 'large' | 'extra-large'
export type NavigationGroupId = 'combat' | 'hero' | 'tower' | 'world' | 'system'
export type TransmutationLibraryFilter = 'all' | 'elemental' | 'material' | 'equipment' | 'special' | 'craftable' | 'active'

export interface CustomThemeColors {
  background: string
  panel: string
  text: string
  muted: string
  accent: string
  secondary: string
  border: string
}

export interface InventoryScreenPreferences {
  currentNeedsOpen: boolean
  sourceOpen: boolean
  usedInOpen: boolean
}

export interface TransmutationScreenPreferences {
  selectedRecipeId: string
  recipeFilter: TransmutationLibraryFilter
  usedInOpen: boolean
  collapsedCategories: Record<RecipeCategory, boolean>
}

export interface ScreenPreferences {
  inventory: InventoryScreenPreferences
  transmutation: TransmutationScreenPreferences
}

export interface UiPreferences {
  theme: UiTheme
  textSize: TextSize
  backgroundEffects: boolean
  reducedMotion: boolean
  customTheme: CustomThemeColors
  navigationGroups: Record<NavigationGroupId, boolean>
  screenState: ScreenPreferences
}
