import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { ARTIFICING_RECIPES } from '../../content/recipes/artificingRecipes'
import { isRecipeUnlocked } from '../../content/recipes/recipeUnlocks'
describe('Artificing dungeon discovery', () => {
  it('requires a normal kill in Howling Den and Catacombs, while boss gear stays boss-gated', () => {
    const state = createInitialState()
    state.progress.firstBossKill = true
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['predator-hide-mantle'])).toBe(false)
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['greatbear-heartstone'])).toBe(false)
    state.progress.lifetimeKillsByMonster['cavefang-wolf'] = 1
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['predator-hide-mantle'])).toBe(true)
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['ossuary-mantle'])).toBe(false)
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['ossuary-mantle'])).toBe(false)
    state.progress.lifetimeKillsByMonster['restless-skeleton'] = 1
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['ossuary-mantle'])).toBe(true)
  })

  it('keeps Soulglass Amulet locked to Edrin and its eight-remnant recipe', () => {
    const state = createInitialState()
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['soulglass-amulet'])).toBe(false)
    state.progress.lifetimeKillsByMonster['restless-skeleton'] = 1
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['soulglass-amulet'])).toBe(false)
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['soulglass-amulet'])).toBe(true)
    expect(ARTIFICING_RECIPES['soulglass-amulet'].ingredients).toEqual([
      { itemId: 'edrin-remnant', quantity: 8 },
      { itemId: 'graveglass-shard', quantity: 5 },
      { itemId: 'soul-residue', quantity: 9 },
      { itemId: 'ossuary-remnant', quantity: 4 },
      { itemId: 'burial-cloth', quantity: 4 },
      { itemId: 'prismatic-fragment', quantity: 2 },
    ])
    expect(ARTIFICING_RECIPES['edrins-signet'].ingredients).toEqual([
      { itemId: 'edrin-remnant', quantity: 20 },
      { itemId: 'burial-cloth', quantity: 8 },
      { itemId: 'soul-residue', quantity: 6 },
      { itemId: 'graveglass-shard', quantity: 5 },
      { itemId: 'ossuary-remnant', quantity: 5 },
    ])
  })
})
