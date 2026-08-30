import { describe, expect, it } from 'vitest'
import { getAdaptiveCombatLayout } from './combatLayout'

describe('getAdaptiveCombatLayout', () => {
  const base = [
    { i: 'combat-stage', x: 0, y: 0, w: 12, h: 14 },
    { i: 'combat-spell-deck', x: 0, y: 14, w: 8, h: 14 },
    { i: 'combat-intel', x: 8, y: 14, w: 4, h: 14 },
  ]

  it('expands the stage and pushes the following panels down without shrinking', () => {
    const layout = getAdaptiveCombatLayout(base, 800)
    expect(layout).toEqual([
      { i: 'combat-stage', x: 0, y: 0, w: 12, h: 19 },
      { i: 'combat-spell-deck', x: 0, y: 19, w: 8, h: 14 },
      { i: 'combat-intel', x: 8, y: 19, w: 4, h: 14 },
    ])
  })

  it('preserves a user layout when the stage already has enough height', () => {
    expect(getAdaptiveCombatLayout(base, 450)).toEqual(base)
  })
})
