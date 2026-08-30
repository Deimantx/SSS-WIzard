import { describe, expect, it } from 'vitest'
import { getAdaptiveCombatLayout } from './combatLayout'

describe('getAdaptiveCombatLayout', () => {
  const base = [
    { i: 'combat-stage', x: 0, y: 0, w: 12, h: 14 },
    { i: 'combat-spell-deck', x: 0, y: 14, w: 12, h: 9 },
    { i: 'combat-log', x: 0, y: 23, w: 12, h: 8 },
  ]

  it('expands the stage and pushes the following panels down without shrinking', () => {
    const layout = getAdaptiveCombatLayout(base, 800)
    expect(layout).toEqual([
      { i: 'combat-stage', x: 0, y: 0, w: 12, h: 19 },
      { i: 'combat-spell-deck', x: 0, y: 19, w: 12, h: 9 },
      { i: 'combat-log', x: 0, y: 28, w: 12, h: 8 },
    ])
  })

  it('preserves a user layout when the stage already has enough height', () => {
    expect(getAdaptiveCombatLayout(base, 450)).toEqual(base)
  })

  it('adapts the Deck to one or two useful rows and collapses the Log to a real compact height', () => {
    const compact = getAdaptiveCombatLayout(base.map((item) => item.i === 'combat-spell-deck' ? { ...item, h: 7 } : item), { requiredDeckContentHeight: 190, logCollapsed: true, logExpandedH: 10 })
    expect(compact.find((item) => item.i === 'combat-spell-deck')).toMatchObject({ y: 14, h: 7 })
    expect(compact.find((item) => item.i === 'combat-log')).toMatchObject({ y: 23, h: 2 })
  })

  it('caps three-plus Spell rows at the useful two-row Deck height and restores expanded Log geometry', () => {
    const adaptive = getAdaptiveCombatLayout(base.map((item) => item.i === 'combat-spell-deck' ? { ...item, h: 7 } : item), { requiredDeckContentHeight: 900, logCollapsed: false, logExpandedH: 10 })
    expect(adaptive.find((item) => item.i === 'combat-spell-deck')?.h).toBe(9)
    expect(adaptive.find((item) => item.i === 'combat-log')).toMatchObject({ y: 23, h: 10 })
  })
})
