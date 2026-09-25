import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters'
import { resolveLifeEssenceRewardRange } from './lifeEssenceReward'
import { resolveMonsterLoot } from './lootResolution'

describe('monster loot resolution', () => {
  it('grants universal Life Essence through the normal item acquisition path', () => {
    const state = createInitialState()
    const drops: Array<[string, number]> = []
    resolveMonsterLoot(state, 'forest-wisp', (itemId, quantity) => drops.push([itemId, quantity]), () => 0)
    expect(state.inventory['artifact-essence']).toBeGreaterThan(0)
    expect(state.inventory['life-essence']).toBe(resolveLifeEssenceRewardRange('forest-wisp', 1).finalMin)
    expect(drops.filter(([itemId]) => itemId === 'life-essence')).toHaveLength(1)
    expect(Object.keys(state.inventory).some((itemId) => (state.inventory[itemId as keyof typeof state.inventory] ?? 0) > 0 && ['ember-staff', 'wispweave-robe', 'wispveil-hood'].includes(itemId))).toBe(false)
  })

  it('scales Life Essence after rolling its WT1 base quantity', () => {
    const wt1 = createInitialState()
    const wt5 = createInitialState()
    wt5.worldTier = { current: 5, highestUnlocked: 5 }
    resolveMonsterLoot(wt1, 'forest-wisp', undefined, () => 0)
    resolveMonsterLoot(wt5, 'forest-wisp', undefined, () => 0)
    const base = resolveLifeEssenceRewardRange('forest-wisp', 1)
    const wt5Range = resolveLifeEssenceRewardRange('forest-wisp', 5)
    expect(wt1.inventory['life-essence']).toBe(base.baseMin)
    expect(wt5.inventory['life-essence']).toBe(wt5Range.finalMin)
  })

  it('uses the encounter snapshot instead of the current global tier', () => {
    const state = createInitialState()
    state.worldTier = { current: 1, highestUnlocked: 4 }
    state.combat.enemyWorldTier = 4
    resolveMonsterLoot(state, 'forest-wisp', undefined, () => 0)
    expect(state.inventory['life-essence']).toBe(resolveLifeEssenceRewardRange('forest-wisp', 4).finalMin)
  })

  it('keeps every monster on the generic material-only authored loot path', () => {
    Object.values(MONSTERS).forEach((monster) => {
      expect(monster.loot.some((drop) => drop.itemId === 'life-essence')).toBe(false)
      const state = createInitialState()
      resolveMonsterLoot(state, monster.id, undefined, () => 0)
      expect(state.inventory['life-essence']).toBeGreaterThan(0)
    })
  })
})
