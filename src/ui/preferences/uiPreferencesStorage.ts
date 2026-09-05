import { customFromPreset, THEME_PRESETS } from '../theme/themePresets'
import { TRANSMUTATION_RECIPE_ORDER as RECIPE_ORDER } from '../../game/content/recipes/recipes'
import { ARTIFICING_RECIPE_ORDER } from '../../game/content/recipes/artificingRecipes'
import type { ArtificingRecipeId, TransmutationRecipeId } from '../../game/types'
import { ITEMS } from '../../game/content/items/items'
import { SCHOOLS } from '../../game/content/schools/schools'
import { COMBAT_DETAILS_MODE_ORDER } from '../../game/presentation/combat/combatDetailsPresentation'
import { DUNGEON_STATISTICS_MODE_ORDER } from '../../game/telemetry/dungeon/dungeonStatisticsTypes'
import type { CombatLogFontSize, ScreenPreferences, TransmutationCategoryFilter, TransmutationTierFilter, UiPreferences } from './uiPreferencesTypes'

export const UI_PREFERENCES_KEY = 'sss-wizard-ui-preferences-v1'
export const defaultScreenPreferences = (): ScreenPreferences => ({
  inventory: { currentNeedsOpen: true, sourceOpen: false, usedInOpen: true },
  transmutation: { selectedRecipeId: RECIPE_ORDER[0], categoryFilter: 'all', tierFilter: 'all', craftableOnly: false, activeOnly: false, collapsedCategories: { elemental: false, material: false } },
  artificing: { selectedRecipeId: null, pinnedRecipeId: null, slotFilter: 'all', weaponHandsFilter: 'all', offhandPresentationFilter: 'all', craftableOnly: false, ownershipFilter: 'all' },
  research: { selectedItemId: null, affinityFilter: 'all', targetSchoolId: 'fire' },
  combat: { combatLogFontSize: 'medium', combatDetailsMode: 'damage-done', dungeonStatisticsMode: 'runs' },
})

export const defaultUiPreferences = (): UiPreferences => ({ theme: 'default', textSize: 'default', backgroundEffects: true, reducedMotion: false, customCursor: true, showFpsCounter: true, uiSounds: true, uiSoundVolume: 0.35, customTheme: customFromPreset(THEME_PRESETS.default), navigationGroups: { combat: false, hero: false, tower: false, world: false, system: false }, screenState: defaultScreenPreferences() })
const validColor = (value: unknown, fallback: string) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
const validVolume = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback

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
  const combat = (screenState.combat && typeof screenState.combat === 'object' ? screenState.combat : {}) as Partial<ScreenPreferences['combat']>
  const collapsedCategories = (transmutation.collapsedCategories && typeof transmutation.collapsedCategories === 'object' ? transmutation.collapsedCategories : {}) as Partial<ScreenPreferences['transmutation']['collapsedCategories']>
  const legacyFilters = ['all', 'elemental', 'material', 'equipment', 'special', 'craftable', 'active'] as const
  const legacyFilter = legacyFilters.includes((transmutation as { recipeFilter?: unknown }).recipeFilter as typeof legacyFilters[number]) ? (transmutation as { recipeFilter: typeof legacyFilters[number] }).recipeFilter : undefined
  const categoryFilters: TransmutationCategoryFilter[] = ['all', 'elemental', 'material']
  const categoryFilter = categoryFilters.includes(transmutation.categoryFilter as TransmutationCategoryFilter) && !(legacyFilter && legacyFilter !== 'all')
    ? transmutation.categoryFilter as TransmutationCategoryFilter
    : legacyFilter === 'elemental' || legacyFilter === 'material' ? legacyFilter : defaults.screenState.transmutation.categoryFilter
  const legacyTierFilter = (transmutation as { materialTierFilter?: unknown }).materialTierFilter
  const inputTierFilter = transmutation.tierFilter ?? legacyTierFilter
  const tierFilter: TransmutationTierFilter = inputTierFilter === 'all' || (typeof inputTierFilter === 'number' && Number.isInteger(inputTierFilter) && inputTierFilter >= 1) ? inputTierFilter : 'all'
  const craftableOnly = transmutation.craftableOnly === true || legacyFilter === 'craftable'
  const activeOnly = transmutation.activeOnly === true || legacyFilter === 'active'
  const selectedRecipeId = typeof transmutation.selectedRecipeId === 'string' && RECIPE_ORDER.includes(transmutation.selectedRecipeId as (typeof RECIPE_ORDER)[number]) ? transmutation.selectedRecipeId as TransmutationRecipeId : defaults.screenState.transmutation.selectedRecipeId
  const selectedItemId = typeof research.selectedItemId === 'string' && Boolean(ITEMS[research.selectedItemId as keyof typeof ITEMS]?.researchSchool) ? research.selectedItemId as keyof typeof ITEMS : null
  const affinityFilter = research.affinityFilter === 'fire' || research.affinityFilter === 'water' || research.affinityFilter === 'earth' || research.affinityFilter === 'air' ? research.affinityFilter : 'all'
  const targetSchoolId = research.targetSchoolId && SCHOOLS[research.targetSchoolId] ? research.targetSchoolId : defaults.screenState.research.targetSchoolId
  const combatLogFontSize: CombatLogFontSize = combat.combatLogFontSize === 'small' || combat.combatLogFontSize === 'large' || combat.combatLogFontSize === 'xlarge' ? combat.combatLogFontSize : 'medium'
  const combatDetailsMode = COMBAT_DETAILS_MODE_ORDER.includes(combat.combatDetailsMode as typeof COMBAT_DETAILS_MODE_ORDER[number]) ? combat.combatDetailsMode as typeof COMBAT_DETAILS_MODE_ORDER[number] : defaults.screenState.combat.combatDetailsMode
  const storedDungeonStatisticsMode = (combat as { dungeonStatisticsMode?: unknown }).dungeonStatisticsMode === 'loot' ? 'drops' : (combat as { dungeonStatisticsMode?: unknown }).dungeonStatisticsMode
  const dungeonStatisticsMode = DUNGEON_STATISTICS_MODE_ORDER.includes(storedDungeonStatisticsMode as typeof DUNGEON_STATISTICS_MODE_ORDER[number]) ? storedDungeonStatisticsMode as typeof DUNGEON_STATISTICS_MODE_ORDER[number] : defaults.screenState.combat.dungeonStatisticsMode
  const rawArtificing = screenState.artificing && typeof screenState.artificing === 'object' ? screenState.artificing : {}
  const a = rawArtificing as Partial<ScreenPreferences['artificing']>
  const oneOf = <T extends string | number>(value: unknown, options: readonly T[], fallback: T): T => options.includes(value as T) ? value as T : fallback
  const artificing: ScreenPreferences['artificing'] = {
    selectedRecipeId: typeof a.selectedRecipeId === 'string' && ARTIFICING_RECIPE_ORDER.includes(a.selectedRecipeId as ArtificingRecipeId) ? a.selectedRecipeId as ArtificingRecipeId : null,
    pinnedRecipeId: typeof a.pinnedRecipeId === 'string' && ARTIFICING_RECIPE_ORDER.includes(a.pinnedRecipeId as ArtificingRecipeId) ? a.pinnedRecipeId as ArtificingRecipeId : null,
    slotFilter: oneOf(a.slotFilter, ['all', 'weapon', 'offhand', 'armor', 'helmet', 'cape', 'amulet', 'ring'] as const, 'all'),
    weaponHandsFilter: oneOf(a.weaponHandsFilter, ['all', 1, 2] as const, 'all'),
    offhandPresentationFilter: oneOf(a.offhandPresentationFilter, ['all', 'shield', 'focus'] as const, 'all'),
    craftableOnly: a.craftableOnly === true,
    ownershipFilter: oneOf(a.ownershipFilter, ['all', 'owned', 'unowned'] as const, 'all'),
  }
  return { theme: input.theme === 'dark' || input.theme === 'light' || input.theme === 'custom' ? input.theme : 'default', textSize: input.textSize === 'large' || input.textSize === 'extra-large' ? input.textSize : 'default', backgroundEffects: input.backgroundEffects !== false, reducedMotion: input.reducedMotion === true, customCursor: input.customCursor !== false, showFpsCounter: input.showFpsCounter !== false, uiSounds: input.uiSounds !== false, uiSoundVolume: validVolume(input.uiSoundVolume, defaults.uiSoundVolume), customTheme: custom, navigationGroups: { combat: groups.combat === true, hero: groups.hero === true, tower: groups.tower === true, world: groups.world === true, system: groups.system === true }, screenState: { artificing, inventory: { currentNeedsOpen: inventory.currentNeedsOpen !== false, sourceOpen: inventory.sourceOpen === true, usedInOpen: inventory.usedInOpen !== false, }, transmutation: { selectedRecipeId, categoryFilter, tierFilter, craftableOnly, activeOnly , collapsedCategories: { elemental: collapsedCategories.elemental === true, material: collapsedCategories.material === true } }, research: { selectedItemId, affinityFilter, targetSchoolId }, combat: { combatLogFontSize, combatDetailsMode, dungeonStatisticsMode } } }
}

export const loadUiPreferences = (): UiPreferences => { try { const raw = window.localStorage.getItem(UI_PREFERENCES_KEY); return raw ? normalizeUiPreferences(JSON.parse(raw)) : defaultUiPreferences() } catch { return defaultUiPreferences() } }
export const saveUiPreferences = (preferences: UiPreferences) => { try { window.localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(preferences)) } catch { /* Storage can be unavailable in private contexts. */ } }
export const resetUiPreferences = () => { const preferences = defaultUiPreferences(); saveUiPreferences(preferences); return preferences }
