import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { ARTIFICING_RECIPES, ARTIFICING_RECIPE_ORDER } from '../../content/recipes/artificingRecipes'
import { isRecipeUnlocked } from '../../content/recipes/recipeUnlocks'
import { getArtifactLevelCap, getArtifactLevelCapRequirement } from '../artifacts/artifactProgression'

describe('Artificing Artifact access', () => {
  it('keeps starter Artifacts unlocked and gates Galeshard Staff on the Gatekeeper', () => {
    const state = createInitialState()
    ARTIFICING_RECIPE_ORDER.filter((recipeId) => recipeId !== 'galeshard-staff').forEach((recipeId) => expect(isRecipeUnlocked(state, ARTIFICING_RECIPES[recipeId])).toBe(true))
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['galeshard-staff'])).toBe(false)
    state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper'] = 1
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['galeshard-staff'])).toBe(true)
  })

  it('uses boss milestones for the Artifact level cap and its player-facing requirement', () => {
    const state = createInitialState()
    expect(getArtifactLevelCap(state, 'ember-staff')).toBe(4)
    expect(getArtifactLevelCapRequirement(state, 'ember-staff')).toContain('Forest Heart')
    state.progress.bossKillsByBoss['forest-heart'] = 1
    expect(getArtifactLevelCap(state, 'ember-staff')).toBe(7)
    expect(getArtifactLevelCapRequirement(state, 'ember-staff')).toContain('Corrupted Greatbear')
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    expect(getArtifactLevelCap(state, 'ember-staff')).toBe(10)
    expect(getArtifactLevelCapRequirement(state, 'ember-staff')).toBeNull()
  })
})
