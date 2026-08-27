import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUTS } from './defaultLayouts'
import { UI_LAYOUTS_KEY, loadUiLayouts } from './layoutEditorStorage'
import { getScreenLayouts } from './layoutUtils'

describe('inventory layout compatibility', () => {
  beforeEach(() => localStorage.clear())

  it('migrates the previous untouched 9/3 inventory default to three panels', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({
      version: 3,
      screens: { inventory: {
        'inventory-catalog': { x: 0, y: 0, w: 9, h: 15 },
        'inventory-detail': { x: 9, y: 0, w: 3, h: 15 },
      } },
    }))

    expect(loadUiLayouts().screens.inventory).toMatchObject({
      'inventory-catalog': { x: 0, y: 0, w: 8, h: 17 },
      'inventory-detail': { x: 8, y: 0, w: 4, h: 12 },
      'inventory-actions': { x: 8, y: 12, w: 4, h: 5 },
    })
  })

  it('preserves a genuinely customized inventory split', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({
      version: 3,
      screens: { inventory: {
        'inventory-catalog': { x: 0, y: 0, w: 7, h: 18 },
        'inventory-detail': { x: 7, y: 0, w: 5, h: 18 },
      } },
    }))

    expect(loadUiLayouts().screens.inventory).toMatchObject({
      'inventory-catalog': { x: 0, y: 0, w: 7, h: 18 },
      'inventory-detail': { x: 7, y: 0, w: 5, h: 18 },
      'inventory-actions': { x: 7, y: 18, w: 5, h: 5 },
    })
  })

  it('migrates the previous 8/4 full-height default without touching custom panels', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({
      version: 3,
      screens: { inventory: {
        'inventory-catalog': { x: 0, y: 0, w: 8, h: 15 },
        'inventory-detail': { x: 8, y: 0, w: 4, h: 15 },
      } },
    }))

    expect(loadUiLayouts().screens.inventory).toMatchObject({
      'inventory-catalog': { x: 0, y: 0, w: 8, h: 17 },
      'inventory-detail': { x: 8, y: 0, w: 4, h: 12 },
      'inventory-actions': { x: 8, y: 12, w: 4, h: 5 },
    })
  })
})

describe('Transmutation default layout', () => {
  it('uses the compact fresh defaults', () => {
    expect(DEFAULT_LAYOUTS['tower-transmutation']).toEqual({
      'transmutation-recipes': { x: 0, y: 0, w: 7, h: 15 },
      'transmutation-detail': { x: 7, y: 0, w: 5, h: 9 },
      'transmutation-focus': { x: 7, y: 9, w: 5, h: 6 },
    })
  })

  it('preserves custom geometry when defaults change', () => {
    const layouts = getScreenLayouts('tower-transmutation', {
      'transmutation-recipes': { x: 1, y: 2, w: 6, h: 20 },
    })

    expect(layouts['transmutation-recipes']).toEqual({ x: 1, y: 2, w: 6, h: 20 })
    expect(layouts['transmutation-detail']).toEqual({ x: 7, y: 0, w: 5, h: 9 })
    expect(layouts['transmutation-focus']).toEqual({ x: 7, y: 9, w: 5, h: 6 })
  })
})

describe('Research layout compatibility', () => {
  it('uses the mastery-first Research defaults', () => {
    expect(DEFAULT_LAYOUTS['tower-research']).toEqual({
      'research-school-mastery': { x: 0, y: 0, w: 12, h: 4 },
      'research-library': { x: 0, y: 4, w: 6, h: 12 },
      'research-inspector': { x: 6, y: 4, w: 6, h: 12 },
      'research-prepared': { x: 0, y: 16, w: 12, h: 10 },
    })
  })

  it('migrates only the previous untouched Research default', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({
      version: 3,
      screens: { 'tower-research': {
        'research-library': { x: 0, y: 0, w: 6, h: 10 },
        'research-inspector': { x: 6, y: 0, w: 6, h: 10 },
        'research-prepared': { x: 0, y: 10, w: 12, h: 10 },
      } },
    }))

    expect(loadUiLayouts().screens['tower-research']).toMatchObject(DEFAULT_LAYOUTS['tower-research'])
  })

  it('preserves custom Research geometry', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({
      version: 3,
      screens: { 'tower-research': {
        'research-library': { x: 0, y: 0, w: 5, h: 15 },
        'research-inspector': { x: 5, y: 0, w: 7, h: 15 },
        'research-prepared': { x: 0, y: 15, w: 12, h: 8 },
      } },
    }))

    expect(loadUiLayouts().screens['tower-research']).toMatchObject({
      'research-library': { x: 0, y: 0, w: 5, h: 15 },
      'research-inspector': { x: 5, y: 0, w: 7, h: 15 },
      'research-prepared': { x: 0, y: 15, w: 12, h: 8 },
    })
  })

  it('migrates the previous twelve-row default and keeps panel flags', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({
      version: 3,
      screens: { 'tower-research': {
        'research-library': { x: 0, y: 0, w: 6, h: 12, locked: true },
        'research-inspector': { x: 6, y: 0, w: 6, h: 12 },
        'research-prepared': { x: 0, y: 12, w: 12, h: 10 },
      } },
    }))

    expect(loadUiLayouts().screens['tower-research']).toMatchObject({
      ...DEFAULT_LAYOUTS['tower-research'],
      'research-library': { ...DEFAULT_LAYOUTS['tower-research']['research-library'], locked: true },
    })
  })

  it('maps legacy Research panels to the safe defaults', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({
      version: 3,
      screens: { 'tower-research': {
        'research-config': { x: 0, y: 0, w: 4, h: 4, locked: true },
        'research-queue': { x: 4, y: 0, w: 8, h: 4, hidden: true },
      } },
    }))

    expect(loadUiLayouts().screens['tower-research']).toMatchObject({
      'research-library': { ...DEFAULT_LAYOUTS['tower-research']['research-library'], locked: true },
      'research-inspector': { ...DEFAULT_LAYOUTS['tower-research']['research-inspector'], hidden: true },
      'research-prepared': DEFAULT_LAYOUTS['tower-research']['research-prepared'],
    })
  })
})

describe('Focus layout compatibility', () => {
  it('uses the three-panel Focus defaults', () => {
    expect(DEFAULT_LAYOUTS['tower-focus']).toEqual({
      'focus-summary': { x: 0, y: 0, w: 12, h: 14 },
      'focus-reservations': { x: 0, y: 14, w: 7, h: 16 },
      'focus-improvement': { x: 7, y: 14, w: 5, h: 16 },
    })
  })

  it('migrates the untouched previous Focus default to the improved geometry', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({ version: 3, screens: { 'tower-focus': {
      'focus-summary': { x: 0, y: 0, w: 12, h: 6 },
      'focus-reservations': { x: 0, y: 6, w: 7, h: 14 },
      'focus-improvement': { x: 7, y: 6, w: 5, h: 14 },
    } } }))

    expect(loadUiLayouts().screens['tower-focus']).toEqual(DEFAULT_LAYOUTS['tower-focus'])
  })

  it('migrates the untouched 11-row Focus default to the taller Overview', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({ version: 3, screens: { 'tower-focus': {
      'focus-summary': { x: 0, y: 0, w: 12, h: 11 },
      'focus-reservations': { x: 0, y: 11, w: 7, h: 16 },
      'focus-improvement': { x: 7, y: 11, w: 5, h: 16 },
    } } }))

    expect(loadUiLayouts().screens['tower-focus']).toEqual(DEFAULT_LAYOUTS['tower-focus'])
  })

  it('preserves a customized Focus layout even when its panels use old geometry', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({ version: 3, screens: { 'tower-focus': {
      'focus-summary': { x: 0, y: 0, w: 12, h: 6 },
      'focus-reservations': { x: 0, y: 6, w: 7, h: 14 },
      'focus-improvement': { x: 7, y: 6, w: 5, h: 14, locked: true },
    } } }))

    expect(loadUiLayouts().screens['tower-focus']).toMatchObject({
      'focus-summary': { x: 0, y: 0, w: 12, h: 6 },
      'focus-reservations': { x: 0, y: 6, w: 7, h: 14 },
      'focus-improvement': { x: 7, y: 6, w: 5, h: 14, locked: true },
    })
  })

  it('places the new improvement panel below a stored two-panel Focus layout', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({ version: 3, screens: { 'tower-focus': {
      'focus-summary': { x: 0, y: 0, w: 7, h: 12 },
      'focus-reservations': { x: 7, y: 0, w: 5, h: 12 },
    } } }))

    expect(loadUiLayouts().screens['tower-focus']).toMatchObject({
      'focus-summary': { x: 0, y: 0, w: 7, h: 12 },
      'focus-reservations': { x: 7, y: 0, w: 5, h: 12 },
      'focus-improvement': { x: 7, y: 14, w: 5, h: 16 },
    })
  })
})

describe('Home expansion layout compatibility', () => {
  it('uses the mastery and current work defaults', () => {
    expect(DEFAULT_LAYOUTS.home).toEqual({
      'home-objective': { x: 0, y: 0, w: 12, h: 4 },
      'home-school-mastery': { x: 0, y: 4, w: 12, h: 6 },
      'home-checklist': { x: 0, y: 10, w: 7, h: 10 },
      'home-wizard': { x: 7, y: 10, w: 5, h: 10 },
      'home-arcane-work': { x: 0, y: 20, w: 12, h: 7 },
    })
  })

  it('migrates the previous canonical Home layout without dropping flags', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({
      version: 3,
      screens: { home: {
        'home-objective': { x: 0, y: 0, w: 12, h: 4 },
        'home-checklist': { x: 0, y: 4, w: 7, h: 10, hidden: true },
        'home-wizard': { x: 7, y: 4, w: 5, h: 10 },
      } },
    }))

    expect(loadUiLayouts().screens.home).toMatchObject({
      ...DEFAULT_LAYOUTS.home,
      'home-checklist': { ...DEFAULT_LAYOUTS.home['home-checklist'], hidden: true },
    })
  })

  it('preserves customized Home geometry and adds new panels below it', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({
      version: 3,
      screens: { home: {
        'home-objective': { x: 0, y: 0, w: 8, h: 5 },
        'home-checklist': { x: 8, y: 0, w: 4, h: 12 },
        'home-wizard': { x: 0, y: 5, w: 8, h: 12 },
      } },
    }))

    const home = loadUiLayouts().screens.home
    expect(home).toMatchObject({
      'home-objective': { x: 0, y: 0, w: 8, h: 5 },
      'home-checklist': { x: 8, y: 0, w: 4, h: 12 },
      'home-wizard': { x: 0, y: 5, w: 8, h: 12 },
      'home-school-mastery': { x: 0, y: 17, w: 12, h: 6 },
      'home-arcane-work': { x: 0, y: 23, w: 12, h: 7 },
    })
  })
})
