import { describe, expect, it } from 'vitest'
import { SCREEN_PANEL_LAYOUTS } from './screenPanelLayouts'

const currentGuildPanelIds = [
  'guild-header',
  'guild-tabs',
  'guild-overview-standing',
  'guild-overview-commission',
  'guild-overview-registry',
  'guild-overview-advancement',
  'guild-overview-projects',
  'guild-contracts',
  'guild-standing',
  'guild-advancement',
  'guild-registry',
  'guild-projects',
  'guild-locked',
]

describe('Guild screen panel layout', () => {
  it('contains exactly the panels currently rendered by GuildScreen', () => {
    expect(Object.keys(SCREEN_PANEL_LAYOUTS['arcane-guild'].panels).sort()).toEqual([...currentGuildPanelIds].sort())
    expect(Object.keys(SCREEN_PANEL_LAYOUTS['arcane-guild'].responsive?.mobile?.panels ?? {}).sort()).toEqual([...currentGuildPanelIds].sort())
  })

  it('uses natural progression heights and keeps a compact header plus separate overview panels', () => {
    const { panels } = SCREEN_PANEL_LAYOUTS['arcane-guild']
    expect(panels['guild-standing'].preferredHeight).toBe('auto')
    expect(panels['guild-advancement'].preferredHeight).toBe('auto')
    expect(Object.entries(panels).filter(([id]) => !['guild-standing', 'guild-advancement'].includes(id)).every(([, panel]) => typeof panel.preferredHeight === 'number')).toBe(true)
    expect(Object.values(panels).every(({ overflow }) => overflow === 'visible')).toBe(true)
    expect(panels['guild-header'].preferredHeight).toBeLessThanOrEqual(180)
    expect(panels['guild-overview-standing']).toMatchObject({ columnStart: 1, columnSpan: 5, rowStart: 3 })
    expect(panels['guild-overview-commission']).toMatchObject({ columnStart: 6, columnSpan: 7, rowStart: 3, alignSelf: 'start' })
    expect(panels['guild-overview-registry']).toMatchObject({ columnStart: 1, columnSpan: 4, rowStart: 4 })
    expect(panels['guild-overview-advancement']).toMatchObject({ columnStart: 5, columnSpan: 4, rowStart: 4 })
    expect(panels['guild-overview-projects']).toMatchObject({ columnStart: 9, columnSpan: 4, rowStart: 4 })
  })
})

describe('Hunter Order Overview panel layout', () => {
  it('uses four separately owned panels without the nested-overflow overview container', () => {
    const { panels, responsive } = SCREEN_PANEL_LAYOUTS['hunters-order']
    const overviewIds = ['hunter-overview-active', 'hunter-overview-services', 'hunter-overview-standing', 'hunter-overview-grounds']
    expect(overviewIds.every((id) => id in panels)).toBe(true)
    expect('hunter-overview' in panels).toBe(false)
    expect(overviewIds.every((id) => panels[id].overflow !== 'auto')).toBe(true)
    expect(Object.keys(responsive?.mobile?.panels ?? {})).toEqual(Object.keys(panels))
  })
})
