import type { ArtificingKindFilter, ArtificingTierFilter, ItemId, RecipeCategory, SchoolId, TransmutationCategoryFilter, TransmutationTierFilter } from '../../game/types'
import type { CombatDetailsMode } from '../../game/presentation/combat/combatDetailsPresentation'
import type { DungeonStatisticsMode } from '../../game/telemetry/dungeon/dungeonStatisticsTypes'

export type UiTheme = 'default' | 'dark' | 'light' | 'custom'
export type TextSize = 'default' | 'large' | 'extra-large'
export type NavigationGroupId = 'combat' | 'hero' | 'tower' | 'world' | 'system'
export type { TransmutationCategoryFilter, TransmutationTierFilter } from '../../game/types'
export const MAX_ARTIFICING_RECIPE_PINS = 6

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
  sourceOpen: boolean
  researchValueOpen: boolean
}

export interface TransmutationScreenPreferences {
  selectedRecipeId: import('../../game/types').TransmutationRecipeId
  pinnedRecipeId: import('../../game/types').TransmutationRecipeId | null
  categoryFilter: TransmutationCategoryFilter
  tierFilter: TransmutationTierFilter
  craftableOnly: boolean
  activeOnly: boolean
  collapsedCategories: Record<RecipeCategory, boolean>
}
export interface ArtificingScreenPreferences {
  selectedRecipeId: import('../../game/types').ArtificingRecipeId | null
  pinnedRecipeIds: import('../../game/types').ArtificingRecipeId[]
  pinsCollapsed: boolean
  slotFilter: 'all' | import('../../game/types').EquipmentItemSlot
  tierFilter: ArtificingTierFilter
  kindFilter: ArtificingKindFilter
  craftableOnly: boolean
  ownershipFilter: 'all' | 'owned' | 'unowned'
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
  dungeonStatisticsMode: DungeonStatisticsMode
}

export interface ScreenPreferences {
  inventory: InventoryScreenPreferences
  transmutation: TransmutationScreenPreferences
  artificing: ArtificingScreenPreferences
  research: ResearchScreenPreferences
  combat: CombatScreenPreferences
}

export interface UiPreferences {
  theme: UiTheme
  textSize: TextSize
  backgroundEffects: boolean
  reducedMotion: boolean
  customCursor: boolean
  showFpsCounter: boolean
  uiSounds: boolean
  uiSoundVolume: number
  customTheme: CustomThemeColors
  navigationGroups: Record<NavigationGroupId, boolean>
  trackedItemId: ItemId | null
  screenState: ScreenPreferences
}
