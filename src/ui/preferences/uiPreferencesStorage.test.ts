import { beforeEach, describe, expect, it } from 'vitest'
import { defaultUiPreferences, loadUiPreferences, normalizeUiPreferences } from './uiPreferencesStorage'
import { getUiPreferences, resetAllUiPreferences, resetAppearance, setCustomThemeColor, setUiPreferences } from './uiPreferencesStore'

describe('screen UI preferences', () => {
  beforeEach(() => { window.localStorage.clear(); resetAllUiPreferences() })

  it('fills legacy preference objects with stable screen defaults', () => {
    const preferences = normalizeUiPreferences({ theme: 'dark' })

    expect(preferences.customCursor).toBe(true)
    expect(preferences.showFpsCounter).toBe(true)
    expect(preferences.uiSounds).toBe(true)
    expect(preferences.uiSoundVolume).toBe(0.35)
    expect(preferences.screenState.inventory).toEqual({ sourceOpen: false, researchValueOpen: false })
    expect(preferences.screenState.transmutation).toEqual({ selectedRecipeId: 'fire-fragment', pinnedRecipeId: null, categoryFilter: 'all', tierFilter: 'all', craftableOnly: false, activeOnly: false, collapsedCategories: { elemental: false, material: false } })
    expect(preferences.screenState.combat).toEqual({ combatLogFontSize: 'medium', combatDetailsMode: 'damage-done', dungeonStatisticsMode: 'runs' })
  })

  it('validates the Full Combat Log font preference independently of gameplay', () => {
    const preferences = normalizeUiPreferences({ screenState: { combat: { combatLogFontSize: 'huge' } } })
    expect(preferences.screenState.combat).toEqual({ combatLogFontSize: 'medium', combatDetailsMode: 'damage-done', dungeonStatisticsMode: 'runs' })

    setUiPreferences({ screenState: { combat: { combatLogFontSize: 'xlarge' } } })
    expect(loadUiPreferences().screenState.combat).toEqual({ combatLogFontSize: 'xlarge', combatDetailsMode: 'damage-done', dungeonStatisticsMode: 'runs' })
  })

  it('migrates the previous Dungeon Statistics Loot mode to Drops', () => {
    const preferences = normalizeUiPreferences({ screenState: { combat: { dungeonStatisticsMode: 'loot' } } })
    expect(preferences.screenState.combat.dungeonStatisticsMode).toBe('drops')
  })

  it('normalizes malformed screen preferences without affecting gameplay', () => {
    const preferences = normalizeUiPreferences({ screenState: { inventory: { currentNeedsOpen: 'yes', sourceOpen: 1, usedInOpen: false }, transmutation: { selectedRecipeId: 7, recipeFilter: 'invalid', collapsedCategories: { elemental: true, material: 'yes', equipment: false } } } })

    expect(preferences.screenState.inventory).toEqual({ sourceOpen: false, researchValueOpen: false })
    expect(preferences.screenState.transmutation).toEqual({ ...defaultUiPreferences().screenState.transmutation, collapsedCategories: { elemental: true, material: false } })
  })

  it('discards legacy Equipment filters and persists Artificing independently', () => {
    const preferences = normalizeUiPreferences({ screenState: { transmutation: { selectedRecipeId: 'ember-staff', categoryFilter: 'equipment', equipmentSlotFilter: 'weapon', unownedOnly: true } } })
    expect(preferences.screenState.transmutation.selectedRecipeId).toBe('fire-fragment')
    expect(preferences.screenState.transmutation).not.toHaveProperty('equipmentSlotFilter')
    expect(preferences.screenState.transmutation).not.toHaveProperty('unownedOnly')
    setUiPreferences({ screenState: { artificing: { selectedRecipeId: 'ember-staff', slotFilter: 'weapon', craftableOnly: true, ownershipFilter: 'unowned' } } })
    expect(loadUiPreferences().screenState.artificing).toEqual(getUiPreferences().screenState.artificing)
    expect(loadUiPreferences().screenState.artificing.selectedRecipeId).toBe('ember-staff')
    expect(normalizeUiPreferences({ screenState: { artificing: { selectedRecipeId: 'fire-fragment' } } }).screenState.artificing.selectedRecipeId).toBeNull()
  })

  it('migrates, deduplicates, validates, and caps Artificing recipe pins', () => {
    expect(normalizeUiPreferences({ screenState: { artificing: { pinnedRecipeId: 'ember-staff' } } }).screenState.artificing.pinnedRecipeIds).toEqual(['ember-staff'])
    expect(normalizeUiPreferences({ screenState: { artificing: { pinnedRecipeIds: ['ember-staff', 'fake-item', 'ember-staff'] } } }).screenState.artificing.pinnedRecipeIds).toEqual(['ember-staff'])
    expect(normalizeUiPreferences({ screenState: { artificing: { pinnedRecipeIds: ['ember-staff', 'tideglass-wand', 'stoneheart-scepter', 'windthread-wand', 'wispweave-robe', 'wispveil-hood', 'windthread-charm'] } } }).screenState.artificing.pinnedRecipeIds).toEqual(['ember-staff', 'tideglass-wand', 'stoneheart-scepter', 'windthread-wand', 'wispweave-robe', 'wispveil-hood'])
    expect(normalizeUiPreferences({ screenState: { artificing: { pinsCollapsed: true } } }).screenState.artificing.pinsCollapsed).toBe(true)
  })

  it('preserves the canonical Artificing Earring slot filter through normalization and reload', () => {
    expect(normalizeUiPreferences({ screenState: { artificing: { slotFilter: 'earring' } } }).screenState.artificing.slotFilter).toBe('earring')
    setUiPreferences({ screenState: { artificing: { slotFilter: 'earring' } } })
    expect(loadUiPreferences().screenState.artificing.slotFilter).toBe('earring')
  })

  it('moves the removed legacy Offhand filter to the Weapon slot', () => {
    const preferences = normalizeUiPreferences({ screenState: { artificing: { slotFilter: 'offhand', weaponHandsFilter: 2, offhandPresentationFilter: 'focus' } } })
    expect(preferences.screenState.artificing.slotFilter).toBe('weapon')
    expect(preferences.screenState.artificing).not.toHaveProperty('weaponHandsFilter')
    expect(preferences.screenState.artificing).not.toHaveProperty('offhandPresentationFilter')
  })

  it('preserves and safely normalizes the Artificing player tier filter', () => {
    expect(normalizeUiPreferences({ screenState: { artificing: { tierFilter: 2 } } }).screenState.artificing.tierFilter).toBe(2)
    expect(normalizeUiPreferences({ screenState: { artificing: { tierFilter: 1.3 } } }).screenState.artificing.tierFilter).toBe('all')
    setUiPreferences({ screenState: { artificing: { tierFilter: 3 } } })
    expect(loadUiPreferences().screenState.artificing.tierFilter).toBe(3)
  })

  it('preserves and safely normalizes the Artificing craft type filter', () => {
    expect(normalizeUiPreferences({ screenState: { artificing: { kindFilter: 'artifact' } } }).screenState.artificing.kindFilter).toBe('artifact')
    expect(normalizeUiPreferences({ screenState: { artificing: { kindFilter: 'stale' } } }).screenState.artificing.kindFilter).toBe('all')
    setUiPreferences({ screenState: { artificing: { kindFilter: 'artifact' } } })
    expect(loadUiPreferences().screenState.artificing.kindFilter).toBe('artifact')
  })

  it('migrates the old material tier preference and removes the obsolete field', () => {
    const preferences = normalizeUiPreferences({ screenState: { transmutation: { materialTierFilter: 2, unownedOnly: true } } })
    expect(preferences.screenState.transmutation.tierFilter).toBe(2)
    expect(preferences.screenState.transmutation).not.toHaveProperty('unownedOnly')
    expect('materialTierFilter' in preferences.screenState.transmutation).toBe(false)
  })

  it('resetAppearance resets appearance only', () => {
    setUiPreferences({
      theme: 'dark',
      textSize: 'extra-large',
      backgroundEffects: false,
      reducedMotion: true,
      navigationGroups: { combat: false, hero: false, tower: true, world: false, system: false },
      screenState: {
        inventory: { sourceOpen: false, researchValueOpen: false },
        artificing: { selectedRecipeId: 'ember-staff', slotFilter: 'weapon' },
      },
    })
    setCustomThemeColor('accent', '#123456')

    resetAppearance()

    const preferences = getUiPreferences()
    expect(preferences.theme).toBe('default')
    expect(preferences.textSize).toBe('default')
    expect(preferences.backgroundEffects).toBe(true)
    expect(preferences.reducedMotion).toBe(false)
    expect(preferences.customCursor).toBe(true)
    expect(preferences.showFpsCounter).toBe(true)
    expect(preferences.customTheme).toEqual(defaultUiPreferences().customTheme)
    expect(preferences.navigationGroups.tower).toBe(true)
    expect(preferences.screenState.inventory.researchValueOpen).toBe(false)
    expect(preferences.screenState.artificing).toMatchObject({ selectedRecipeId: 'ember-staff', slotFilter: 'weapon' })
  })
})
