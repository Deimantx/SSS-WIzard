import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { resolveMonsterLoot } from './lootResolution'

describe('monster loot resolution', () => {
  it('resolves only authored material loot and never creates finished Equipment', () => {
    const state = createInitialState()
    resolveMonsterLoot(state, 'forest-wisp', undefined, () => 0)
    expect(state.inventory['artifact-essence']).toBeGreaterThan(0)
    expect(state.inventory['life-essence']).toBeGreaterThan(0)
    expect(Object.keys(state.inventory).some((itemId) => (state.inventory[itemId as keyof typeof state.inventory] ?? 0) > 0 && ['ember-staff', 'wispweave-robe', 'wispveil-hood'].includes(itemId))).toBe(false)
  })
})
