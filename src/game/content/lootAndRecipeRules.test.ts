import { describe, expect, it } from 'vitest'
import { getItemDropSources, getItemSourceInfo } from './contentRelations'
import { ITEMS } from './items/items'
import { MONSTERS, validateMonsterDefinitions, type MonsterDefinition } from './monsters'
import { RECIPES, RECIPE_ORDER, type CraftingRecipeDefinition, validateRecipeDefinitions } from './recipes/recipes'
import type { ItemId, RecipeId } from '../types'

describe('material-only loot and Artificing-only Equipment', () => {
  it('keeps every current monster and boss loot entry material-only', () => {
    Object.values(MONSTERS).forEach((monster) => monster.loot.forEach((drop) => {
      expect(ITEMS[drop.itemId].kind).toBe('material')
    }))
  })

  it('rejects a monster fixture that drops finished Equipment', () => {
    const fixture: MonsterDefinition = {
      ...MONSTERS['forest-heart'],
      loot: [...MONSTERS['forest-heart'].loot, { itemId: 'ember-staff' as ItemId, min: 1, max: 1, chance: 0.05 }],
    }
    expect(validateMonsterDefinitions({ ...MONSTERS, 'forest-heart': fixture })).toContain('forest-heart: monster loot may only contain materials; ember-staff is equipment')
  })

  it('keeps boss materials as the only signature drop path', () => {
    expect(MONSTERS['forest-heart'].loot).toEqual(expect.arrayContaining([
      { itemId: 'heartseed', min: 1, max: 1, chance: 1 },
      { itemId: 'life-essence', min: 10, max: 18, chance: 1 },
    ]))
    expect(MONSTERS['corrupted-greatbear'].loot).toEqual(expect.arrayContaining([
      { itemId: 'greatbear-core', min: 1, max: 1, chance: 0.35 },
      { itemId: 'life-essence', min: 12, max: 30, chance: 1 },
    ]))
    expect(MONSTERS['archmage-edrin-shade'].loot).toEqual(expect.arrayContaining([
      { itemId: 'edrin-remnant', min: 1, max: 1, chance: 0.35 },
      { itemId: 'life-essence', min: 21, max: 48, chance: 1 },
    ]))
    expect(MONSTERS['forest-heart'].loot.some((drop) => drop.itemId === 'heartseed-necklace')).toBe(false)
    expect(MONSTERS['corrupted-greatbear'].loot.some((drop) => drop.itemId === 'greatbear-heartstone')).toBe(false)
    expect(MONSTERS['archmage-edrin-shade'].loot.some((drop) => drop.itemId === 'edrins-signet')).toBe(false)
  })

  it('defines one material-only Artificing recipe for every Equipment item', () => {
    const equipment = Object.values(ITEMS).filter((item) => item.kind === 'equipment')
    const equipmentOutputs = Object.values(RECIPES).filter((recipe) => ITEMS[recipe.output.itemId]?.kind === 'equipment')
    expect(equipment).toHaveLength(27)
    expect(new Set(equipmentOutputs.map((recipe) => recipe.output.itemId)).size).toBe(27)
    expect(validateRecipeDefinitions()).toEqual([])
  })

  it('rejects missing, duplicate, and wrongly categorized Equipment recipes', () => {
    const withoutHeartseed = { ...RECIPES } as Record<string, CraftingRecipeDefinition>
    delete withoutHeartseed['heartseed-necklace']
    expect(validateRecipeDefinitions(withoutHeartseed, RECIPE_ORDER.filter((id) => id !== 'heartseed-necklace'))).toContain('heartseed-necklace: Equipment must have exactly one Artificing recipe (found 0)')

    const duplicate = {
      ...RECIPES,
      'duplicate-heartseed': { ...RECIPES['heartseed-necklace'], id: 'duplicate-heartseed' as RecipeId },
    } as Record<string, CraftingRecipeDefinition>
    expect(validateRecipeDefinitions(duplicate, [...RECIPE_ORDER, 'duplicate-heartseed'])).toContain('heartseed-necklace: Equipment must have exactly one Artificing recipe (found 2)')

  })

  it('uses the Artificing source and no direct drop relation for signature Equipment', () => {
    const signatureIds = ['heartseed-necklace', 'greatbear-heartstone', 'edrins-signet'] as const
    signatureIds.forEach((itemId) => {
      expect(ITEMS[itemId].source).toBe('Artificing')
      expect(ITEMS[itemId].sourceNavigation).toBe('tower-artificing')
      expect(getItemDropSources(itemId)).toEqual([])
      expect(getItemSourceInfo(itemId).relations).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'recipe', id: itemId })]))
    })
  })

  it('uses the transition signature recipe values', () => {
    expect(RECIPES['heartseed-necklace']).toMatchObject({ ingredients: [{ itemId: 'heartseed', quantity: 20 }], unlock: { type: 'boss-kill', bossId: 'forest-heart' }, output: { quantity: 1 } })
    expect(RECIPES['greatbear-heartstone']).toMatchObject({ ingredients: [{ itemId: 'greatbear-core', quantity: 21 }], unlock: { type: 'boss-kill', bossId: 'corrupted-greatbear' }, output: { quantity: 1 } })
    expect(RECIPES['edrins-signet']).toMatchObject({ ingredients: [{ itemId: 'edrin-remnant', quantity: 35 }], unlock: { type: 'boss-kill', bossId: 'archmage-edrin-shade' }, output: { quantity: 1 } })
  })
})
