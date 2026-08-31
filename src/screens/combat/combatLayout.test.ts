import { describe, expect, it } from 'vitest'
import { getAdaptiveCombatLayout } from './combatLayout'

describe('getAdaptiveCombatLayout', () => {
  const base = [
    { i: 'combat-stage', x: 0, y: 0, w: 12, h: 14 },
    { i: 'combat-spell-deck', x: 0, y: 14, w: 12, h: 7 },
    { i: 'combat-details', x: 0, y: 21, w: 6, h: 8 },
    { i: 'combat-dungeon-statistics', x: 6, y: 21, w: 6, h: 8 },
  ]

  it('expands the stage and pushes the following stack down without shrinking', () => {
    expect(getAdaptiveCombatLayout(base, 800)).toEqual([
      { i: 'combat-stage', x: 0, y: 0, w: 12, h: 19 },
      { i: 'combat-spell-deck', x: 0, y: 19, w: 12, h: 7 },
      { i: 'combat-details', x: 0, y: 26, w: 6, h: 8 },
      { i: 'combat-dungeon-statistics', x: 6, y: 26, w: 6, h: 8 },
    ])
  })

  it('preserves the stack when the stage already has enough height', () => {
    expect(getAdaptiveCombatLayout(base, 450)).toEqual(base)
  })

  it('caps the Spell Deck at two useful rows and keeps Details below it', () => {
    const layout = getAdaptiveCombatLayout(base, { requiredDeckContentHeight: 900 })
    expect(layout.find((item) => item.i === 'combat-spell-deck')).toMatchObject({ y: 14, h: 9 })
    expect(layout.find((item) => item.i === 'combat-details')).toMatchObject({ y: 23, h: 8 })
    expect(layout.find((item) => item.i === 'combat-dungeon-statistics')).toMatchObject({ x: 6, y: 23, w: 6, h: 8 })
  })

  it('uses one shared bottom row Y for both analytics panels', () => {
    const custom = base.map((item) => item.i === 'combat-details' ? { ...item, y: 30, h: 10 } : item)
    expect(getAdaptiveCombatLayout(custom, {})).toEqual(custom.map((item) => item.i === 'combat-details' || item.i === 'combat-dungeon-statistics' ? { ...item, y: 21 } : item))
  })

  it('uses a stage high-water mark so the bottom row does not jump between encounters', () => {
    const expanded = getAdaptiveCombatLayout(base, { requiredStageContentHeight: 800 })
    const stabilized = getAdaptiveCombatLayout(base, { requiredStageContentHeight: 800 })
    expect(expanded.find((item) => item.i === 'combat-dungeon-statistics')?.y).toBe(26)
    expect(stabilized.find((item) => item.i === 'combat-dungeon-statistics')?.y).toBe(26)
  })
})
