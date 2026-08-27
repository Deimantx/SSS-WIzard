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
  it('uses the safe twelve-row Research defaults', () => {
    expect(DEFAULT_LAYOUTS['tower-research']).toEqual({
      'research-library': { x: 0, y: 0, w: 6, h: 12 },
      'research-inspector': { x: 6, y: 0, w: 6, h: 12 },
      'research-prepared': { x: 0, y: 12, w: 12, h: 10 },
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
