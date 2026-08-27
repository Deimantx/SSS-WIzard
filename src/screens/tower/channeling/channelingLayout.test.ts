import { describe, expect, it } from 'vitest'
import { getChannelingExpandedLayout } from './channelingLayout'

const baseLayout = [
  { i: 'channeling-mana-core', x: 0, y: 0, w: 6, h: 9 },
  { i: 'channeling-echoes', x: 6, y: 0, w: 6, h: 9 },
  { i: 'channeling-pillars', x: 0, y: 9, w: 12, h: 25 },
]

describe('getChannelingExpandedLayout', () => {
  it('moves the lower panel below an expanded Mana Core', () => {
    const layout = getChannelingExpandedLayout(baseLayout, { manaCore: true, echoes: false })

    expect(layout.find((item) => item.i === 'channeling-mana-core')).toMatchObject({ y: 0, h: 16 })
    expect(layout.find((item) => item.i === 'channeling-pillars')).toMatchObject({ y: 16 })
  })

  it('moves the lower panel below an expanded Echo panel', () => {
    const layout = getChannelingExpandedLayout(baseLayout, { manaCore: false, echoes: true })

    expect(layout.find((item) => item.i === 'channeling-echoes')).toMatchObject({ y: 0, h: 14 })
    expect(layout.find((item) => item.i === 'channeling-pillars')).toMatchObject({ y: 14 })
  })

  it('uses the tallest expanded panel when both details are open', () => {
    const layout = getChannelingExpandedLayout(baseLayout, { manaCore: true, echoes: true })

    expect(layout.find((item) => item.i === 'channeling-pillars')).toMatchObject({ y: 16 })
  })

  it('returns the saved geometry when all details are closed', () => {
    const layout = getChannelingExpandedLayout(baseLayout, { manaCore: false, echoes: false })

    expect(layout).toEqual(baseLayout)
  })
})
