import { describe, expect, it } from 'vitest'
import { themeColors } from '../theme/themePresets'
import { defaultUiPreferences } from '../preferences/uiPreferencesStorage'
import { getAmbientProfile } from './ambientProfiles'

describe('ambient presentation profiles', () => {
  const colors = themeColors(defaultUiPreferences().theme, defaultUiPreferences().customTheme)

  it('keeps distinct screen moods in a pure presentation helper', () => {
    const home = getAmbientProfile('home', colors)
    const combat = getAmbientProfile('combat', colors)
    const transmutation = getAmbientProfile('tower-transmutation', colors)

    expect(home.id).toBe('home-calm')
    expect(combat.accentColor).toBe(colors.danger)
    expect(combat.particleSpeed).toBeGreaterThan(home.particleSpeed)
    expect(transmutation.biasX).toBe('52%')
  })
})
