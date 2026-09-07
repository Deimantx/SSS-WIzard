import { describe, expect, it } from 'vitest'
import { getItemDropSources, getItemSourceInfo } from './contentRelations'
import { ITEMS } from './items/items'
import { MONSTERS, validateMonsterDefinitions, type MonsterDefinition } from './monsters'
import { DUNGEONS } from './dungeons/dungeons'
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

  it('distributes four regular crafting materials across each dungeon roster', () => {
    const expectedMaterials = {
      'whispering-woods': ['wisp-essence', 'thorn-fiber', 'rootstone-shard', 'grove-bark'],
      'howling-den': ['predator-fang', 'predator-hide', 'corrupted-beast-essence', 'predator-sinew'],
      'abandoned-catacombs': ['ossuary-remnant', 'graveglass-shard', 'soul-residue', 'burial-cloth'],
    } as const

    Object.entries(expectedMaterials).forEach(([dungeonId, expected]) => {
      const regularMaterials = new Set(DUNGEONS[dungeonId as keyof typeof DUNGEONS].monsterPool.flatMap((monsterId) => MONSTERS[monsterId].loot.filter((drop) => drop.itemId !== 'life-essence').map((drop) => drop.itemId)))
      expect(regularMaterials.size).toBeGreaterThanOrEqual(4)
      expect([...regularMaterials]).toEqual(expect.arrayContaining([...expected]))
    })

    expect(MONSTERS['forest-wisp'].loot).toEqual(expect.arrayContaining([{ itemId: 'wisp-essence', min: 1, max: 2, chance: 0.2 }]))
    expect(MONSTERS.thornling.loot).toEqual(expect.arrayContaining([{ itemId: 'thorn-fiber', min: 1, max: 2, chance: 0.2 }]))
    expect(MONSTERS['stone-root'].loot).toEqual(expect.arrayContaining([{ itemId: 'rootstone-shard', min: 1, max: 3, chance: 0.2 }]))
    expect(MONSTERS['cavefang-wolf'].loot).toEqual(expect.arrayContaining([{ itemId: 'predator-sinew', min: 1, max: 1, chance: 0.1 }]))
    expect(MONSTERS['restless-skeleton'].loot).toEqual(expect.arrayContaining([{ itemId: 'burial-cloth', min: 1, max: 1, chance: 0.1 }]))
    expect(MONSTERS['fallen-acolyte'].loot).toEqual(expect.arrayContaining([{ itemId: 'burial-cloth', min: 1, max: 1, chance: 0.15 }]))
  })

  it('defines one material-only Artificing recipe for every Equipment item', () => {
    const equipment = Object.values(ITEMS).filter((item) => item.kind === 'equipment')
    const equipmentOutputs = Object.values(RECIPES).filter((recipe) => ITEMS[recipe.output.itemId]?.kind === 'equipment')
    expect(equipment).toHaveLength(21)
    expect(new Set(equipmentOutputs.map((recipe) => recipe.output.itemId)).size).toBe(21)
    expect(validateRecipeDefinitions()).toEqual([])
  })

  it('keeps Equipment flavor descriptions aligned between items and Artificing recipes', () => {
    const equipmentRecipes = Object.values(RECIPES).filter((recipe) => 'sourceDungeonId' in recipe)
    expect(equipmentRecipes).toHaveLength(21)
    equipmentRecipes.forEach((recipe) => expect(recipe.description).toBe(ITEMS[recipe.output.itemId].description))
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
    expect(RECIPES['heartseed-necklace']).toMatchObject({ ingredients: [{ itemId: 'heartseed', quantity: 8 }, { itemId: 'grove-bark', quantity: 10 }, { itemId: 'rootstone-shard', quantity: 10 }, { itemId: 'life-essence', quantity: 40 }], unlock: { type: 'boss-kill', bossId: 'forest-heart' }, output: { quantity: 1 } })
    expect(RECIPES['greatbear-heartstone']).toMatchObject({ ingredients: [{ itemId: 'greatbear-core', quantity: 8 }, { itemId: 'corrupted-beast-essence', quantity: 8 }, { itemId: 'predator-hide', quantity: 8 }, { itemId: 'predator-sinew', quantity: 8 }], unlock: { type: 'boss-kill', bossId: 'corrupted-greatbear' }, output: { quantity: 1 } })
    expect(RECIPES['edrins-signet']).toMatchObject({ ingredients: [{ itemId: 'edrin-remnant', quantity: 20 }, { itemId: 'graveglass-shard', quantity: 8 }, { itemId: 'soul-residue', quantity: 8 }, { itemId: 'burial-cloth', quantity: 8 }], unlock: { type: 'boss-kill', bossId: 'archmage-edrin-shade' }, output: { quantity: 1 } })
    expect(RECIPES['soulglass-amulet']).toMatchObject({ ingredients: [{ itemId: 'edrin-remnant', quantity: 8 }, { itemId: 'graveglass-shard', quantity: 12 }, { itemId: 'soul-residue', quantity: 10 }, { itemId: 'prismatic-fragment', quantity: 8 }], unlock: { type: 'boss-kill', bossId: 'archmage-edrin-shade' }, output: { quantity: 1 } })
  })

  it('requires four distinct ingredients and uses every new dungeon material', () => {
    const artificingRecipes = Object.values(RECIPES).filter((recipe) => 'sourceDungeonId' in recipe)
    expect(artificingRecipes.every((recipe) => new Set(recipe.ingredients.map((ingredient) => ingredient.itemId)).size >= 4)).toBe(true)
    ;(['thorn-fiber', 'rootstone-shard', 'predator-sinew', 'burial-cloth'] as const).forEach((itemId) => {
      expect(ITEMS[itemId].kind).toBe('material')
      expect(artificingRecipes.some((recipe) => recipe.ingredients.some((ingredient) => ingredient.itemId === itemId))).toBe(true)
    })

    const invalid = { ...RECIPES, 'ember-staff': { ...RECIPES['ember-staff'], ingredients: RECIPES['ember-staff'].ingredients.slice(0, 3) } }
    expect(validateRecipeDefinitions(invalid)).toContain('ember-staff: Artificing recipe must have at least 4 distinct ingredients')
  })
})
