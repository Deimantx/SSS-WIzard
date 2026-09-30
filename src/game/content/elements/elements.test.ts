import { describe, expect, it } from 'vitest'
import { ELEMENT_DEFINITIONS, ELEMENT_IDS, getElementMatchup, getElementMultiplier, getTutorialCounterAffinity, isElementId } from './elements'

describe('element definitions', () => {
  it('defines the starting elements and keeps Arcane neutral until authored otherwise', () => {
    expect(ELEMENT_IDS).toEqual(expect.arrayContaining(['fire', 'water', 'air', 'earth']))
    expect(ELEMENT_DEFINITIONS.arcane).toBeDefined()
    expect(getElementMultiplier('arcane', 'fire')).toBe(1)
    expect(isElementId('unknown')).toBe(false)
  })

  it.each([
    ['fire', 'earth', 1.5], ['fire', 'water', 0.5], ['fire', 'air', 1], ['fire', 'fire', 1],
    ['water', 'fire', 1.5], ['water', 'air', 0.5], ['water', 'earth', 1], ['water', 'water', 1],
    ['air', 'water', 1.5], ['air', 'earth', 0.5], ['air', 'fire', 1], ['air', 'air', 1],
    ['earth', 'air', 1.5], ['earth', 'fire', 0.5], ['earth', 'water', 1], ['earth', 'earth', 1],
  ] as const)('%s against %s resolves to %s', (attacking, defending, expected) => {
    expect(getElementMultiplier(attacking, defending)).toBe(expected)
  })

  it('classifies matchups from the same configured multiplier', () => {
    expect(getElementMatchup('fire', 'earth')).toBe('strong')
    expect(getElementMatchup('fire', 'water')).toBe('resisted')
    expect(getElementMatchup('fire', 'fire')).toBe('neutral')
  })

  it('derives tutorial counter affinities from the authored matchup matrix', () => {
    expect(getTutorialCounterAffinity('fire')).toBe('earth')
    expect(getTutorialCounterAffinity('earth')).toBe('air')
    expect(getTutorialCounterAffinity('air')).toBe('water')
    expect(getTutorialCounterAffinity('water')).toBe('fire')
  })
})
