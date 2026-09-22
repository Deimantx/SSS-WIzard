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

  it.each([
    [1, 2],
    [2, 4],
    [5, 10],
  ] as const)('scales a successful base quantity of 2 at WT%s to %s', (tier, expected) => {
    const state = createInitialState()
    state.worldTier = { current: tier, highestUnlocked: tier }
    const values = [0, 0.5, 0, 0.5]
    let index = 0
    resolveMonsterLoot(state, 'forest-wisp', undefined, () => values[index++] ?? 0.5)
    expect(state.inventory['life-essence']).toBe(expected)
  })

  it('keeps authored drop chance unchanged while scaling only successful quantity', () => {
    const missedAtWt1 = createInitialState()
    const missedAtWt5 = createInitialState()
    missedAtWt5.worldTier = { current: 5, highestUnlocked: 5 }
    const missSequence = () => {
      let index = 0
      const values = [0, 0, 0.25]
      return () => values[index++] ?? 0.25
    }
    resolveMonsterLoot(missedAtWt1, 'stone-root', undefined, missSequence())
    resolveMonsterLoot(missedAtWt5, 'stone-root', undefined, missSequence())
    expect(missedAtWt1.inventory['life-essence'] ?? 0).toBe(0)
    expect(missedAtWt5.inventory['life-essence'] ?? 0).toBe(0)

    const hitAtWt1 = createInitialState()
    const hitAtWt5 = createInitialState()
    hitAtWt5.worldTier = { current: 5, highestUnlocked: 5 }
    const hitSequence = () => {
      let index = 0
      const values = [0, 0, 0.15, 0.5]
      return () => values[index++] ?? 0.5
    }
    resolveMonsterLoot(hitAtWt1, 'stone-root', undefined, hitSequence())
    resolveMonsterLoot(hitAtWt5, 'stone-root', undefined, hitSequence())
    expect(hitAtWt1.inventory['life-essence']).toBe(2)
    expect(hitAtWt5.inventory['life-essence']).toBe(10)
  })

  it('uses the encounter snapshot instead of the current global tier', () => {
    const state = createInitialState()
    state.worldTier = { current: 1, highestUnlocked: 4 }
    state.combat.enemyWorldTier = 4
    resolveMonsterLoot(state, 'forest-wisp', undefined, () => 0.5)
    expect(state.inventory['life-essence']).toBe(8)
  })
})
