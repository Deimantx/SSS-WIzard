import { describe, expect, it } from 'vitest'
import type { Layout } from 'react-grid-layout'
import { getAdaptiveEquipmentLayout } from './equipmentLayout'

const baseLayout: Layout = [
  { i: 'equipment-loadout', x: 0, y: 0, w: 7, h: 13 },
  { i: 'equipment-stats', x: 7, y: 0, w: 5, h: 13 },
  { i: 'equipment-owned', x: 0, y: 13, w: 8, h: 13 },
  { i: 'equipment-inspector', x: 8, y: 13, w: 4, h: 13 },
]

describe('adaptive Equipment layout', () => {
  it('expands either top panel and pushes Armory and Gear Inspector below the tallest one', () => {
    const expanded = getAdaptiveEquipmentLayout(baseLayout, { requiredLoadoutContentHeight: 700, requiredStatsContentHeight: 1000 })

    expect(expanded.find((item) => item.i === 'equipment-loadout')).toMatchObject({ h: 17 })
    expect(expanded.find((item) => item.i === 'equipment-stats')).toMatchObject({ h: 24 })
    expect(expanded.find((item) => item.i === 'equipment-owned')).toMatchObject({ y: 24 })
    expect(expanded.find((item) => item.i === 'equipment-inspector')).toMatchObject({ y: 24 })
  })

  it('preserves the saved layout when both measured panels fit', () => {
    expect(getAdaptiveEquipmentLayout(baseLayout, { requiredLoadoutContentHeight: 500, requiredStatsContentHeight: 500 })).toEqual(baseLayout)
  })
})
