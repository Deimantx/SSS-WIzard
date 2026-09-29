import { describe, expect, it } from 'vitest'
import { SCREEN_PANEL_LAYOUTS } from './screenPanelLayouts'

const currentGuildPanelIds = [
  'guild-header',
  'guild-tabs',
  'guild-progression',
  'guild-recommended-contracts',
  'guild-advancement-summary',
  'guild-contracts',
  'guild-skills-summary',
  'guild-skills',
  'guild-skills-note',
  'guild-registry',
  'guild-projects',
  'guild-chains',
  'guild-locked',
]

describe('Guild screen panel layout', () => {
  it('contains exactly the panels currently rendered by GuildScreen', () => {
    expect(Object.keys(SCREEN_PANEL_LAYOUTS['arcane-guild'].panels).sort()).toEqual([...currentGuildPanelIds].sort())
    expect(Object.keys(SCREEN_PANEL_LAYOUTS['arcane-guild'].responsive?.mobile?.panels ?? {}).sort()).toEqual([...currentGuildPanelIds].sort())
  })

  it('uses explicit pixel heights and keeps the current overview hierarchy', () => {
    const { panels } = SCREEN_PANEL_LAYOUTS['arcane-guild']
    expect(Object.values(panels).every(({ preferredHeight }) => typeof preferredHeight === 'number')).toBe(true)
    expect(Object.values(panels).every(({ overflow }) => overflow === 'visible')).toBe(true)
    expect(panels['guild-progression']).toMatchObject({ columnStart: 1, columnSpan: 5, rowStart: 3 })
    expect(panels['guild-recommended-contracts']).toMatchObject({ columnStart: 6, columnSpan: 7, rowStart: 3, alignSelf: 'start' })
    expect(panels['guild-advancement-summary']).toMatchObject({ columnStart: 1, columnSpan: 12, rowStart: 4 })
  })
})
