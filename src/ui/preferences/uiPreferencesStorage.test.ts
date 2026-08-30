import { beforeEach, describe, expect, it } from 'vitest'
import { defaultUiPreferences, loadUiPreferences, normalizeUiPreferences } from './uiPreferencesStorage'
import { getUiPreferences, resetAllUiPreferences, resetAppearance, setCustomThemeColor, setUiPreferences } from './uiPreferencesStore'

describe('screen UI preferences', () => {
  beforeEach(() => { window.localStorage.clear(); resetAllUiPreferences() })

  it('fills legacy preference objects with stable screen defaults', () => {
    const preferences = normalizeUiPreferences({ theme: 'dark' })

    expect(preferences.screenState.inventory).toEqual({ currentNeedsOpen: true, sourceOpen: false, usedInOpen: true })
    expect(preferences.screenState.transmutation).toEqual({ selectedRecipeId: 'fire-fragment', recipeFilter: 'all', usedInOpen: true, collapsedCategories: { elemental: false, material: false, equipment: false, special: false } })
    expect(preferences.screenState.combat).toEqual({ combatLogFontSize: 'medium', combatLogCollapsed: false, lastExpandedCombatLogH: 7, combatDetailsMode: 'damage-done' })
  })

  it('validates Combat Log font and collapse preferences independently of gameplay', () => {
    const preferences = normalizeUiPreferences({ screenState: { combat: { combatLogFontSize: 'huge', combatLogCollapsed: 'yes', lastExpandedCombatLogH: -4 } } })
    expect(preferences.screenState.combat).toEqual({ combatLogFontSize: 'medium', combatLogCollapsed: false, lastExpandedCombatLogH: 2, combatDetailsMode: 'damage-done' })

    setUiPreferences({ screenState: { combat: { combatLogFontSize: 'xlarge', combatLogCollapsed: true, lastExpandedCombatLogH: 12 } } })
    expect(loadUiPreferences().screenState.combat).toEqual({ combatLogFontSize: 'xlarge', combatLogCollapsed: true, lastExpandedCombatLogH: 12, combatDetailsMode: 'damage-done' })
  })

  it('normalizes malformed screen preferences without affecting gameplay', () => {
    const preferences = normalizeUiPreferences({ screenState: { inventory: { currentNeedsOpen: 'yes', sourceOpen: 1, usedInOpen: false }, transmutation: { selectedRecipeId: 7, recipeFilter: 'invalid', usedInOpen: 'no', collapsedCategories: { elemental: true, material: 'yes', equipment: false } } } })

    expect(preferences.screenState.inventory).toEqual({ currentNeedsOpen: true, sourceOpen: false, usedInOpen: false })
    expect(preferences.screenState.transmutation).toEqual({ ...defaultUiPreferences().screenState.transmutation, collapsedCategories: { elemental: true, material: false, equipment: false, special: false } })
  })

  it('serializes selected recipe, filter, and detail state independently of gameplay', () => {
    setUiPreferences({ screenState: { transmutation: { selectedRecipeId: 'ember-staff', recipeFilter: 'equipment', usedInOpen: false, collapsedCategories: { equipment: true } } } })

    expect(getUiPreferences().screenState.transmutation).toEqual({ selectedRecipeId: 'ember-staff', recipeFilter: 'equipment', usedInOpen: false, collapsedCategories: { elemental: false, material: false, equipment: true, special: false } })
    expect(loadUiPreferences().screenState.transmutation).toEqual({ selectedRecipeId: 'ember-staff', recipeFilter: 'equipment', usedInOpen: false, collapsedCategories: { elemental: false, material: false, equipment: true, special: false } })
  })

  it('resetAppearance resets appearance only', () => {
    setUiPreferences({
      theme: 'dark',
      textSize: 'extra-large',
      backgroundEffects: false,
      reducedMotion: true,
      navigationGroups: { combat: false, hero: false, tower: true, world: false, system: false },
      screenState: {
        inventory: { usedInOpen: false },
        transmutation: { selectedRecipeId: 'ember-staff', recipeFilter: 'equipment', collapsedCategories: { equipment: true } },
      },
    })
    setCustomThemeColor('accent', '#123456')

    resetAppearance()

    const preferences = getUiPreferences()
    expect(preferences.theme).toBe('default')
    expect(preferences.textSize).toBe('default')
    expect(preferences.backgroundEffects).toBe(true)
    expect(preferences.reducedMotion).toBe(false)
    expect(preferences.customTheme).toEqual(defaultUiPreferences().customTheme)
    expect(preferences.navigationGroups.tower).toBe(true)
    expect(preferences.screenState.inventory.usedInOpen).toBe(false)
    expect(preferences.screenState.transmutation).toMatchObject({ selectedRecipeId: 'ember-staff', recipeFilter: 'equipment', usedInOpen: true, collapsedCategories: { equipment: true } })
  })
})
