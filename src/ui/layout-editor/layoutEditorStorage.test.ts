import { beforeEach, describe, expect, it } from 'vitest'
import { UI_LAYOUTS_KEY, loadUiLayouts } from './layoutEditorStorage'

describe('inventory layout compatibility', () => {
  beforeEach(() => localStorage.clear())

  it('migrates only the previous untouched 9/3 inventory default', () => {
    localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({
      version: 3,
      screens: { inventory: {
        'inventory-catalog': { x: 0, y: 0, w: 9, h: 15 },
        'inventory-detail': { x: 9, y: 0, w: 3, h: 15 },
      } },
    }))

    expect(loadUiLayouts().screens.inventory).toMatchObject({
      'inventory-catalog': { x: 0, y: 0, w: 8, h: 15 },
      'inventory-detail': { x: 8, y: 0, w: 4, h: 15 },
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
    })
  })
})
