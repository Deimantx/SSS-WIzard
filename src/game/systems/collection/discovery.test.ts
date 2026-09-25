import { describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { resolveMonsterLoot } from '../loot/lootResolution'
import { completeTransmutationCycle } from '../transmutation/transmutationEngine'
import { discoverMonster } from './discovery'
import { grantItem } from '../inventory/itemAcquisition'
import { TRANSMUTATION_RECIPES } from '../../content/recipes/transmutationRecipes'
import { resolvePowerScaledCurrencyRewardRange } from '../loot/powerScaledCurrencyRewards'

describe('archive discovery', () => {
  it('records a monster on encounter and remains idempotent', () => {
    const state = createInitialState()
    discoverMonster(state, 'forest-wisp')
    discoverMonster(state, 'forest-wisp')
    expect(state.progress.discoveredMonsters).toEqual(['forest-wisp'])
  })

  it('records guaranteed loot through the same transaction as the inventory grant', () => {
    const state = createInitialState()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    resolveMonsterLoot(state, 'forest-wisp')
    expect(state.inventory['artifact-essence']).toBe(resolvePowerScaledCurrencyRewardRange('forest-wisp', 'artifact-essence', 1).finalMin)
    expect(state.inventory['life-essence']).toBe(resolvePowerScaledCurrencyRewardRange('forest-wisp', 'life-essence', 1).finalMin)
    expect(state.progress.discoveredItems).toEqual(expect.arrayContaining(['artifact-essence', 'life-essence']))
    vi.restoreAllMocks()
  })

  it('keeps discovery after the item is consumed', () => {
    const state = createInitialState()
    grantItem(state, 'fire-fragment', 1)
    state.inventory['fire-fragment'] = 0
    expect(state.progress.discoveredItems).toContain('fire-fragment')
  })

  it('discovers successful Transmutation output', () => {
    const state = createInitialState()
    const recipe = TRANSMUTATION_RECIPES['prismatic-fragment']
    recipe.ingredients.forEach(({ itemId, quantity }) => { state.inventory[itemId] = quantity })
    expect(completeTransmutationCycle(state, recipe, { mode: 'live', random: () => 0.99 })).toBe(true)
    expect(state.inventory['prismatic-fragment']).toBe(1)
    expect(state.progress.discoveredItems).toContain('prismatic-fragment')
  })
})
