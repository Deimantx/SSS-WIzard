import { beforeEach, describe, expect, it } from 'vitest'
import { defaultUiPreferences, loadUiPreferences, normalizeUiPreferences } from './uiPreferencesStorage'
import { getUiPreferences, resetAppearance, setUiPreferences } from './uiPreferencesStore'

describe('screen UI preferences', () => {
  beforeEach(() => { window.localStorage.clear(); resetAppearance() })

  it('fills legacy preference objects with stable screen defaults', () => {
    const preferences = normalizeUiPreferences({ theme: 'dark' })

    expect(preferences.screenState.inventory).toEqual({ currentNeedsOpen: true, sourceOpen: false, usedInOpen: true })
    expect(preferences.screenState.transmutation).toEqual({ selectedRecipeId: 'fire-fragment', recipeFilter: 'all', usedInOpen: true })
  })

  it('normalizes malformed screen preferences without affecting gameplay', () => {
    const preferences = normalizeUiPreferences({ screenState: { inventory: { currentNeedsOpen: 'yes', sourceOpen: 1, usedInOpen: false }, transmutation: { selectedRecipeId: 7, recipeFilter: 'invalid', usedInOpen: 'no' } } })

    expect(preferences.screenState.inventory).toEqual({ currentNeedsOpen: true, sourceOpen: false, usedInOpen: false })
    expect(preferences.screenState.transmutation).toEqual(defaultUiPreferences().screenState.transmutation)
  })

  it('serializes selected recipe, filter, and detail state independently of gameplay', () => {
    setUiPreferences({ screenState: { transmutation: { selectedRecipeId: 'ember-staff', recipeFilter: 'equipment', usedInOpen: false } } })

    expect(getUiPreferences().screenState.transmutation).toEqual({ selectedRecipeId: 'ember-staff', recipeFilter: 'equipment', usedInOpen: false })
    expect(loadUiPreferences().screenState.transmutation).toEqual({ selectedRecipeId: 'ember-staff', recipeFilter: 'equipment', usedInOpen: false })
  })
})
