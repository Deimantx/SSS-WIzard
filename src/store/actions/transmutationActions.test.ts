import { describe, expect, it } from 'vitest'
import { RECIPES } from '../../game/content/recipes/recipes'
import { getConsumableQuantity } from '../../game/core/inventory/inventoryConsumption'
import { createInitialState } from '../initialState'
import { grantTransmutationMissingIngredientsAction } from './transmutationActions'

describe('transmutation developer ingredient grants', () => {
  it('grants only the missing amount for the requested cycle count', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 1

    grantTransmutationMissingIngredientsAction(state, 'prismatic-fragment')

    const recipe = RECIPES['prismatic-fragment']
    recipe.ingredients.forEach((ingredient) => {
      expect(getConsumableQuantity(state, ingredient.itemId)).toBe(ingredient.quantity)
    })
  })

  it('uses the same missing calculation for a ten-cycle fixture', () => {
    const state = createInitialState()
    state.inventory['wisp-essence'] = 4

    grantTransmutationMissingIngredientsAction(state, 'prismatic-fragment', 10)

    expect(getConsumableQuantity(state, 'life-essence')).toBe(100)
    expect(getConsumableQuantity(state, 'fire-fragment')).toBe(20)
    expect(getConsumableQuantity(state, 'water-fragment')).toBe(20)
  })
})
