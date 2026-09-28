import { describe, expect, it } from 'vitest'
import { COMBAT_LOCATION_ICONS } from './CombatLocationIcon'

describe('Combat location icon contract', () => {
  it('keeps Combat, Elite, Hunting Ground, Dungeon, Special, and Tower semantics distinct', () => {
    const icons = Object.values(COMBAT_LOCATION_ICONS)
    expect(new Set(icons).size).toBe(6)
    expect(COMBAT_LOCATION_ICONS['elite-zone']).not.toBe(COMBAT_LOCATION_ICONS.dungeon)
    expect(COMBAT_LOCATION_ICONS['hunting-ground']).not.toBe(COMBAT_LOCATION_ICONS['combat-zone'])
  })
})
