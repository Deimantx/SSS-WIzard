import { describe, expect, it } from 'vitest'
import { getAdaptiveCombatLayout } from './combatLayout'

describe('getAdaptiveCombatLayout', () => {
  const base = [
    { i: 'combat-stage', x: 0, y: 0, w: 12, h: 14 },
    { i: 'combat-spell-deck', x: 0, y: 14, w: 12, h: 7 },
    { i: 'combat-analytics', x: 0, y: 21, w: 12, h: 8 },
  ]

  it('keeps the bounded Stage geometry stable while stacking lower panels', () => {
    expect(getAdaptiveCombatLayout(base, 800)).toEqual(base)
  })

  it('preserves the stack when the stage already has enough height', () => {
    expect(getAdaptiveCombatLayout(base, 450)).toEqual(base)
  })

  it('caps the Spell Deck at two useful rows and keeps Details below it', () => {
    const layout = getAdaptiveCombatLayout(base, { requiredDeckContentHeight: 900 })
    expect(layout.find((item) => item.i === 'combat-spell-deck')).toMatchObject({ y: 14, h: 9 })
    expect(layout.find((item) => item.i === 'combat-analytics')).toMatchObject({ y: 23, h: 8 })
  })

  it('uses one shared bottom row Y for both analytics panels', () => {
    const custom = base.map((item) => item.i === 'combat-analytics' ? { ...item, y: 30, h: 10 } : item)
    expect(getAdaptiveCombatLayout(custom, {})).toEqual(custom.map((item) => item.i === 'combat-analytics' ? { ...item, y: 21 } : item))
  })

})
