import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUTS } from './defaultLayouts'
import { UI_LAYOUTS_KEY, loadUiLayouts, resetUiLayouts } from './layoutEditorStorage'
import { LAYOUT_VERSION } from './layoutEditorTypes'
import { clampTopbarLayout, DEFAULT_TOPBAR_LAYOUT } from './shellLayout'
import type { TopbarLayout } from './layoutEditorTypes'
import { getScreenLayouts } from './layoutUtils'

describe('UI layout version policy', () => {
  beforeEach(() => localStorage.clear())

  it('preserves same-version screen customization and ignores unknown panels', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({
      version: LAYOUT_VERSION,
      screens: {
        equipment: {
          'equipment-loadout': { x: 1, y: 3, w: 7, h: 14, hidden: true, locked: true },
          'removed-panel': { x: 4, y: 4, w: 4, h: 4 },
        },
      },
      shell: { topbar: DEFAULT_TOPBAR_LAYOUT },
    }))

    const loaded = loadUiLayouts()
    expect(loaded.screens.equipment).toEqual({ 'equipment-loadout': { x: 1, y: 3, w: 7, h: 14, hidden: true, locked: true } })
    expect(getScreenLayouts('equipment', loaded.screens.equipment)).toMatchObject(DEFAULT_LAYOUTS.equipment)
  })

  it('resets every screen layout and panel flag on version mismatch', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({
      version: LAYOUT_VERSION - 1,
      screens: {
        combat: { 'combat-stage': { x: 4, y: 9, w: 6, h: 18, hidden: true, locked: true } },
        inventory: { 'inventory-catalog': { x: 2, y: 2, w: 8, h: 20 } },
      },
      shell: { topbar: DEFAULT_TOPBAR_LAYOUT },
    }))

    const loaded = loadUiLayouts()
    expect(loaded.screens).toEqual({})
    expect(getScreenLayouts('combat', loaded.screens.combat)).toEqual(DEFAULT_LAYOUTS.combat)
    expect(JSON.parse(localStorage.getItem(UI_LAYOUTS_KEY) ?? '{}')).toMatchObject({ version: LAYOUT_VERSION, screens: {} })
  })

  it('preserves and clamps the topbar when screen layouts reset', () => {
    const topbar = {
      order: ['topbar-focus', 'unknown', 'topbar-health'],
      widths: { 'topbar-focus': -100, 'topbar-mana': 5000, 'topbar-health': 1000 },
    } as unknown as Partial<TopbarLayout>
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({ version: LAYOUT_VERSION - 1, screens: { home: { 'home-objective': { x: 2, y: 2, w: 8, h: 5 } } }, shell: { topbar } }))

    const loaded = loadUiLayouts()
    expect(loaded.screens).toEqual({})
    expect(loaded.shell.topbar).toEqual(clampTopbarLayout(topbar))
    expect(loaded.shell.topbar).not.toEqual(DEFAULT_TOPBAR_LAYOUT)
  })

  it('imports a versioned legacy key only to preserve the topbar', () => {
    localStorage.setItem('sss-wizard-ui-layout-v14', JSON.stringify({
      version: 14,
      screens: { 'tower-channeling': { 'channeling-pillars': { x: 0, y: 9, w: 12, h: 25, hidden: true } } },
      shell: { topbar: { ...DEFAULT_TOPBAR_LAYOUT, widths: { ...DEFAULT_TOPBAR_LAYOUT.widths, 'topbar-mana': 600 } } },
    }))

    const loaded = loadUiLayouts()
    expect(loaded.screens).toEqual({})
    expect(loaded.shell.topbar.widths['topbar-mana']).toBe(600)
    expect(JSON.parse(localStorage.getItem(UI_LAYOUTS_KEY) ?? '{}')).toMatchObject({ version: LAYOUT_VERSION, screens: {} })
  })

  it('explicitly resets the stable and transition storage keys', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, '{}')
    localStorage.setItem('sss-wizard-ui-layout-v14', '{}')
    localStorage.setItem('sss-wizard-ui-layout-v2', '{}')

    resetUiLayouts()

    expect(localStorage.getItem(UI_LAYOUTS_KEY)).toBeNull()
    expect(localStorage.getItem('sss-wizard-ui-layout-v14')).toBeNull()
    expect(localStorage.getItem('sss-wizard-ui-layout-v2')).toBeNull()
  })
})
