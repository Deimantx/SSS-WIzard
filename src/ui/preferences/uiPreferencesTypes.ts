import type { ItemId, RecipeCategory, SchoolId } from '../../game/types'
import type { CombatDetailsMode } from '../../game/presentation/combat/combatDetailsPresentation'

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

export type ResearchAffinityFilter = 'all' | SchoolId
export interface ResearchScreenPreferences {
  selectedItemId: ItemId | null
  affinityFilter: ResearchAffinityFilter
  targetSchoolId: SchoolId
}

export type CombatLogFontSize = 'small' | 'medium' | 'large' | 'xlarge'
export interface CombatScreenPreferences {
  combatLogFontSize: CombatLogFontSize
  combatDetailsMode: CombatDetailsMode
}

export interface ScreenPreferences {
  inventory: InventoryScreenPreferences
  transmutation: TransmutationScreenPreferences
  research: ResearchScreenPreferences
  combat: CombatScreenPreferences
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
