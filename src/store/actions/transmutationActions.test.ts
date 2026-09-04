import { describe, expect, it } from 'vitest'
import { RECIPES } from '../../game/content/recipes/recipes'
import { getConsumableQuantity } from '../../game/core/inventory/inventoryConsumption'
import { createInitialState } from '../initialState'
import { grantTransmutationMissingIngredientsAction } from './transmutationActions'

describe('transmutation developer ingredient grants', () => {
  it('grants only the missing amount for the requested cycle count', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 1

    grantTransmutationMissingIngredientsAction(state, 'ember-staff')

    const recipe = RECIPES['ember-staff']
    recipe.ingredients.forEach((ingredient) => {
      expect(getConsumableQuantity(state, ingredient.itemId)).toBe(ingredient.quantity)
    })
  })

  it('uses the same missing calculation for a ten-cycle fixture', () => {
    const state = createInitialState()
    state.inventory['wisp-essence'] = 4

    grantTransmutationMissingIngredientsAction(state, 'ember-staff', 10)

    expect(getConsumableQuantity(state, 'wisp-essence')).toBe(60)
    expect(getConsumableQuantity(state, 'fire-fragment')).toBe(120)
    expect(getConsumableQuantity(state, 'grove-bark')).toBe(30)
  })
})
