import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { ARTIFICING_RECIPES, ARTIFICING_RECIPE_ORDER } from '../../content/recipes/artificingRecipes'
import { isRecipeUnlocked } from '../../content/recipes/recipeUnlocks'
import { getArtifactLevelCap, getArtifactLevelCapRequirement } from '../artifacts/artifactProgression'

describe('Artificing starter Artifact access', () => {
  it('keeps all six current Artifact recipes unlocked on a fresh save', () => {
    const state = createInitialState()
    ARTIFICING_RECIPE_ORDER.forEach((recipeId) => expect(isRecipeUnlocked(state, ARTIFICING_RECIPES[recipeId])).toBe(true))
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
