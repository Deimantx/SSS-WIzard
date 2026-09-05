import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { ARTIFICING_RECIPES } from '../../content/recipes/artificingRecipes'
import { isRecipeUnlocked } from '../../content/recipes/recipeUnlocks'
describe('Artificing dungeon discovery', () => {
  it('requires a normal kill in Howling Den and Catacombs, while boss gear stays boss-gated', () => {
    const state = createInitialState()
    state.progress.firstBossKill = true
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['fangbound-dagger'])).toBe(false)
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['greatbear-heartstone'])).toBe(false)
    state.progress.lifetimeKillsByMonster['cavefang-wolf'] = 1
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['fangbound-dagger'])).toBe(true)
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['graveglass-wand'])).toBe(false)
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['graveglass-wand'])).toBe(false)
    state.progress.lifetimeKillsByMonster['restless-skeleton'] = 1
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['graveglass-wand'])).toBe(true)
  })
})
