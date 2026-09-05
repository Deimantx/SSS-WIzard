import { describe, expect, it } from 'vitest'
import { TRANSMUTATION_RECIPES as RECIPES } from './transmutationRecipes'

describe('player-facing transmutation recipe content', () => {
  it('does not expose internal tuning markers in elemental descriptions', () => {
    Object.values(RECIPES).filter((recipe) => recipe.category === 'elemental').forEach((recipe) => {
      expect(recipe.description ?? '').not.toMatch(/^\[TUNING\]/)
    })
  })
})
