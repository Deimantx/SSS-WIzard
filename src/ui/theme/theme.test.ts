import { beforeEach, describe, expect, it } from 'vitest'
import { assessThemeContrast, hasReadableContrast } from './contrast'
import { applyUiPreferences } from './themeManager'
import { customFromPreset, THEME_PRESETS } from './themePresets'
import { UI_PREFERENCES_KEY, defaultUiPreferences, loadUiPreferences, normalizeUiPreferences, resetUiPreferences, saveUiPreferences } from '../preferences/uiPreferencesStorage'

describe('theme and appearance preferences', () => {
  beforeEach(() => { window.localStorage.clear(); document.documentElement.removeAttribute('data-theme'); document.documentElement.removeAttribute('data-text-size'); document.documentElement.style.cssText = '' })

  it('keeps preset contrast readable', () => {
    for (const preset of Object.values(THEME_PRESETS)) expect(hasReadableContrast(preset)).toBe(true)
    expect(assessThemeContrast(THEME_PRESETS.light).mutedPanel).toBeGreaterThanOrEqual(3)
  })

  it('normalizes invalid custom hex values to safe defaults', () => {
    const preferences = normalizeUiPreferences({ theme: 'custom', customTheme: { text: 'not-a-color', background: '#101010' } })
    expect(preferences.customTheme.text).toBe(defaultUiPreferences().customTheme.text)
    expect(preferences.customTheme.background).toBe('#101010')
  })

  it('clears custom inline overrides when switching to a preset', () => {
    const custom = { ...defaultUiPreferences(), theme: 'custom' as const, customTheme: { ...defaultUiPreferences().customTheme, background: '#101010' } }
    applyUiPreferences(custom)
    expect(document.documentElement.style.getPropertyValue('--ui-bg')).toBe('#101010')
    applyUiPreferences({ ...custom, theme: 'dark' })
    expect(document.documentElement.style.getPropertyValue('--ui-bg')).toBe('')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('serializes and resets appearance independently', () => {
    const preferences = { ...defaultUiPreferences(), theme: 'light' as const, textSize: 'large' as const, backgroundEffects: false, customTheme: customFromPreset(THEME_PRESETS.light) }
    saveUiPreferences(preferences)
    expect(loadUiPreferences()).toMatchObject({ theme: 'light', textSize: 'large', backgroundEffects: false })
    expect(window.localStorage.getItem(UI_PREFERENCES_KEY)).toBeTruthy()
    expect(resetUiPreferences()).toMatchObject({ theme: 'default', textSize: 'default', backgroundEffects: true })
  })
})
