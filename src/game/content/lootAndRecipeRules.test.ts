import { describe, expect, it } from 'vitest'
import { getItemDropSources, getItemSourceInfo } from './contentRelations'
import { ITEMS } from './items/items'
import { MONSTERS, validateMonsterDefinitions, type MonsterDefinition } from './monsters'
import { DUNGEONS } from './dungeons/dungeons'
import { ARTIFICING_RECIPES, RECIPES, RECIPE_ORDER, type CraftingRecipeDefinition, validateRecipeDefinitions } from './recipes/recipes'
import { ARTIFACTS } from './artifacts/artifacts'
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

  it('distributes the intended four regular crafting materials across each dungeon roster', () => {
    const expectedMaterials = {
      'whispering-woods': ['wisp-essence', 'thorn-fiber', 'rootstone-shard', 'grove-bark'],
      'howling-den': ['predator-fang', 'predator-hide', 'corrupted-beast-essence', 'predator-sinew'],
      'abandoned-catacombs': ['ossuary-remnant', 'graveglass-shard', 'soul-residue', 'burial-cloth'],
    } as const

    Object.entries(expectedMaterials).forEach(([dungeonId, expected]) => {
      const regularMaterials = new Set(DUNGEONS[dungeonId as keyof typeof DUNGEONS].monsterPool.flatMap((monsterId) => MONSTERS[monsterId].loot.filter((drop) => drop.itemId !== 'life-essence').map((drop) => drop.itemId)))
      expect([...regularMaterials].sort()).toEqual([...expected].sort())
    })

    expect(MONSTERS['forest-wisp'].loot).toEqual(expect.arrayContaining([{ itemId: 'wisp-essence', min: 1, max: 2, chance: 0.2 }]))
    expect(MONSTERS.thornling.loot).toEqual(expect.arrayContaining([{ itemId: 'thorn-fiber', min: 1, max: 2, chance: 0.2 }]))
    expect(MONSTERS['stone-root'].loot).toEqual(expect.arrayContaining([{ itemId: 'rootstone-shard', min: 1, max: 2, chance: 0.2 }]))
    expect(MONSTERS['grove-sentinel'].loot).toEqual(expect.arrayContaining([{ itemId: 'grove-bark', min: 1, max: 2, chance: 0.2 }]))
    expect(MONSTERS['cavefang-wolf'].loot).toEqual(expect.arrayContaining([{ itemId: 'predator-fang', min: 1, max: 2, chance: 0.2 }, { itemId: 'predator-hide', min: 1, max: 1, chance: 0.1 }]))
    expect(MONSTERS['razorclaw-lynx'].loot).toEqual(expect.arrayContaining([{ itemId: 'predator-sinew', min: 1, max: 2, chance: 0.2 }, { itemId: 'predator-hide', min: 1, max: 1, chance: 0.1 }]))
    expect(MONSTERS['corrupted-dire-wolf'].loot).toEqual(expect.arrayContaining([{ itemId: 'corrupted-beast-essence', min: 1, max: 2, chance: 0.2 }, { itemId: 'predator-hide', min: 1, max: 1, chance: 0.1 }]))
    expect(MONSTERS['restless-skeleton'].loot).toEqual(expect.arrayContaining([{ itemId: 'ossuary-remnant', min: 1, max: 2, chance: 0.2 }, { itemId: 'graveglass-shard', min: 1, max: 1, chance: 0.1 }]))
    expect(MONSTERS['grave-wraith'].loot).toEqual(expect.arrayContaining([{ itemId: 'soul-residue', min: 1, max: 2, chance: 0.2 }, { itemId: 'graveglass-shard', min: 1, max: 1, chance: 0.1 }]))
    expect(MONSTERS['fallen-acolyte'].loot).toEqual(expect.arrayContaining([{ itemId: 'burial-cloth', min: 1, max: 2, chance: 0.2 }, { itemId: 'graveglass-shard', min: 1, max: 1, chance: 0.1 }]))

    expect(MONSTERS['forest-heart'].loot).toEqual(expect.arrayContaining([
      { itemId: 'wisp-essence', min: 1, max: 2, chance: 1 }, { itemId: 'thorn-fiber', min: 1, max: 2, chance: 1 },
      { itemId: 'rootstone-shard', min: 1, max: 2, chance: 1 }, { itemId: 'grove-bark', min: 1, max: 2, chance: 1 },
    ]))
    expect(MONSTERS['corrupted-greatbear'].loot).toEqual(expect.arrayContaining([
      { itemId: 'predator-fang', min: 1, max: 2, chance: 1 }, { itemId: 'predator-hide', min: 1, max: 2, chance: 1 },
      { itemId: 'corrupted-beast-essence', min: 1, max: 2, chance: 1 }, { itemId: 'predator-sinew', min: 1, max: 2, chance: 1 },
    ]))
    expect(MONSTERS['archmage-edrin-shade'].loot).toEqual(expect.arrayContaining([
      { itemId: 'ossuary-remnant', min: 1, max: 2, chance: 1 }, { itemId: 'soul-residue', min: 1, max: 2, chance: 1 },
      { itemId: 'graveglass-shard', min: 1, max: 2, chance: 1 }, { itemId: 'burial-cloth', min: 1, max: 2, chance: 1 },
    ]))
  })

  it('preserves Life Essence behavior and signature rates', () => {
    const expectedLifeDrops = {
      'forest-wisp': [1, 3, 1], 'thornling': [1, 3, 1], 'stone-root': [1, 3, 0.2], 'grove-sentinel': [2, 5, 1], 'forest-heart': [10, 18, 1],
      'cavefang-wolf': [3, 5, 1], 'razorclaw-lynx': [3, 5, 1], 'corrupted-dire-wolf': [3, 5, 1], 'corrupted-greatbear': [12, 30, 1],
      'restless-skeleton': [4, 8, 1], 'grave-wraith': [4, 8, 1], 'fallen-acolyte': [5, 10, 1], 'archmage-edrin-shade': [21, 48, 1],
    } as const
    Object.entries(expectedLifeDrops).forEach(([monsterId, [min, max, chance]]) => {
      expect(MONSTERS[monsterId as keyof typeof MONSTERS].loot).toContainEqual({ itemId: 'life-essence', min, max, chance })
    })
    expect(MONSTERS['forest-heart'].loot).toContainEqual({ itemId: 'heartseed', min: 1, max: 1, chance: 1 })
    expect(MONSTERS['corrupted-greatbear'].loot).toContainEqual({ itemId: 'greatbear-core', min: 1, max: 1, chance: 0.35 })
    expect(MONSTERS['archmage-edrin-shade'].loot).toContainEqual({ itemId: 'edrin-remnant', min: 1, max: 1, chance: 0.35 })

    const signatureIds = ['heartseed', 'greatbear-core', 'edrin-remnant'] as const
    Object.values(MONSTERS).filter((monster) => monster.bestiaryCategory !== 'boss').forEach((monster) => {
      expect(monster.loot.some((drop) => signatureIds.includes(drop.itemId as typeof signatureIds[number]))).toBe(false)
    })
    const signatureSources = { heartseed: 'forest-heart', 'greatbear-core': 'corrupted-greatbear', 'edrin-remnant': 'archmage-edrin-shade' } as const
    Object.entries(signatureSources).forEach(([itemId, bossId]) => {
      expect(Object.values(MONSTERS).filter((monster) => monster.loot.some((drop) => drop.itemId === itemId)).map((monster) => monster.id)).toEqual([bossId])
    })
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
    expect(RECIPES['heartseed-necklace']).toMatchObject({ ingredients: [{ itemId: 'heartseed', quantity: 8 }, { itemId: 'rootstone-shard', quantity: 8 }, { itemId: 'grove-bark', quantity: 10 }, { itemId: 'thorn-fiber', quantity: 2 }, { itemId: 'life-essence', quantity: 10 }], unlock: { type: 'boss-kill', bossId: 'forest-heart' }, output: { quantity: 1 } })
    expect(RECIPES['greatbear-heartstone']).toMatchObject({ ingredients: [{ itemId: 'greatbear-core', quantity: 8 }, { itemId: 'predator-hide', quantity: 9 }, { itemId: 'predator-sinew', quantity: 4 }, { itemId: 'predator-fang', quantity: 2 }, { itemId: 'corrupted-beast-essence', quantity: 9 }], unlock: { type: 'boss-kill', bossId: 'corrupted-greatbear' }, output: { quantity: 1 } })
    expect(RECIPES['edrins-signet']).toMatchObject({ ingredients: [{ itemId: 'edrin-remnant', quantity: 20 }, { itemId: 'burial-cloth', quantity: 8 }, { itemId: 'soul-residue', quantity: 6 }, { itemId: 'graveglass-shard', quantity: 5 }, { itemId: 'ossuary-remnant', quantity: 5 }], unlock: { type: 'boss-kill', bossId: 'archmage-edrin-shade' }, output: { quantity: 1 } })
    expect(RECIPES['soulglass-amulet']).toMatchObject({ ingredients: [{ itemId: 'edrin-remnant', quantity: 8 }, { itemId: 'graveglass-shard', quantity: 5 }, { itemId: 'soul-residue', quantity: 9 }, { itemId: 'ossuary-remnant', quantity: 4 }, { itemId: 'burial-cloth', quantity: 4 }, { itemId: 'prismatic-fragment', quantity: 2 }], unlock: { type: 'boss-kill', bossId: 'archmage-edrin-shade' }, output: { quantity: 1 } })
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

  it('keeps Artifact forge costs synchronized with their Artificing recipes', () => {
    Object.values(ARTIFACTS).forEach((artifact) => expect(artifact.forge.ingredients).toEqual(ARTIFICING_RECIPES[artifact.id].ingredients))
    expect(validateRecipeDefinitions()).toEqual([])
  })

  it('applies the Prismatic Focus-only Fragment reduction', () => {
    expect(ARTIFICING_RECIPES['prismatic-focus'].ingredients).toEqual([
      { itemId: 'prismatic-fragment', quantity: 2 }, { itemId: 'wisp-essence', quantity: 5 },
      { itemId: 'rootstone-shard', quantity: 10 }, { itemId: 'thorn-fiber', quantity: 5 }, { itemId: 'life-essence', quantity: 25 },
    ])
    expect(ARTIFACTS['prismatic-focus'].forge.ingredients).toEqual(ARTIFICING_RECIPES['prismatic-focus'].ingredients)
    expect(ARTIFACTS['prismatic-focus'].upgrades.map((entry) => entry.ingredients.find((ingredient) => ingredient.itemId === 'prismatic-fragment')?.quantity)).toEqual([4, 7, 12, 18, 29, 44, 60, 88, 132])
    expect(Object.fromEntries(Object.entries(ARTIFACTS).filter(([id]) => id !== 'prismatic-focus').map(([id, artifact]) => [id, artifact.upgrades.flatMap((entry) => entry.ingredients.filter((ingredient) => ingredient.itemId === 'prismatic-fragment').map((ingredient) => ingredient.quantity))]))).toEqual({
      'ember-staff': [5, 9, 14, 20, 30, 45],
      'tideglass-wand': [5, 9, 14, 20, 30, 45],
      'stoneheart-scepter': [5, 9, 14, 20, 30, 45],
      'windthread-wand': [5, 9, 14, 20, 30, 45],
      'wispweave-robe': [5, 8, 13, 20, 25, 38, 55],
      'wispveil-hood': [5, 8, 10, 15, 23, 30, 43, 63],
    })
  })

  it('validates every Artifact upgrade and long-term use of new dungeon materials', () => {
    const upgradeIngredients = Object.values(ARTIFACTS).flatMap((artifact) => artifact.upgrades.flatMap((upgradeDefinition) => upgradeDefinition.ingredients))
    Object.values(ARTIFACTS).forEach((artifact) => expect(artifact.upgrades.map((entry) => [entry.fromLevel, entry.toLevel])).toEqual([[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10]]))
    upgradeIngredients.forEach((ingredient) => expect(ITEMS[ingredient.itemId]).toBeDefined())
    ;(['thorn-fiber', 'rootstone-shard', 'predator-sinew', 'burial-cloth'] as const).forEach((itemId) => expect(upgradeIngredients.some((ingredient) => ingredient.itemId === itemId)).toBe(true))
  })

  it('matches the authored recipe and Artifact progression aggregate totals', () => {
    const sumIngredients = (ingredients: { itemId: string; quantity: number }[]) => ingredients.reduce<Record<string, number>>((totals, ingredient) => ({ ...totals, [ingredient.itemId]: (totals[ingredient.itemId] ?? 0) + ingredient.quantity }), {})
    const addTotals = (...totalsList: Record<string, number>[]) => totalsList.reduce<Record<string, number>>((combined, totals) => Object.entries(totals).reduce((next, [itemId, quantity]) => ({ ...next, [itemId]: (next[itemId] ?? 0) + quantity }), combined), {})
    const recipeTotals = sumIngredients(Object.values(RECIPES).filter((recipe) => 'sourceDungeonId' in recipe).flatMap((recipe) => recipe.ingredients))
    const upgradeTotals = sumIngredients(Object.values(ARTIFACTS).flatMap((artifact) => artifact.upgrades.flatMap((entry) => entry.ingredients)))
    const recipeDungeonTotals = (dungeonId: keyof typeof DUNGEONS) => sumIngredients(Object.values(RECIPES).filter((recipe) => 'sourceDungeonId' in recipe && recipe.sourceDungeonId === dungeonId).flatMap((recipe) => recipe.ingredients))
    const only = (totals: Record<string, number>, ids: readonly string[]) => Object.fromEntries(ids.map((id) => [id, totals[id] ?? 0]))

    expect(only(recipeDungeonTotals('whispering-woods'), ['wisp-essence', 'thorn-fiber', 'rootstone-shard', 'grove-bark'])).toEqual({ 'wisp-essence': 80, 'thorn-fiber': 80, 'rootstone-shard': 80, 'grove-bark': 81 })
    expect(only(recipeDungeonTotals('howling-den'), ['predator-fang', 'predator-hide', 'corrupted-beast-essence', 'predator-sinew'])).toEqual({ 'predator-fang': 40, 'predator-hide': 40, 'corrupted-beast-essence': 41, 'predator-sinew': 40 })
    expect(only(recipeDungeonTotals('abandoned-catacombs'), ['ossuary-remnant', 'soul-residue', 'graveglass-shard', 'burial-cloth'])).toEqual({ 'ossuary-remnant': 49, 'soul-residue': 49, 'graveglass-shard': 48, 'burial-cloth': 48 })
    expect(only(recipeTotals, ['life-essence', 'prismatic-fragment'])).toEqual({ 'life-essence': 184, 'prismatic-fragment': 17 })
    expect(only(upgradeTotals, ['wisp-essence', 'thorn-fiber', 'rootstone-shard', 'grove-bark'])).toEqual({ 'wisp-essence': 285, 'thorn-fiber': 285, 'rootstone-shard': 285, 'grove-bark': 285 })
    expect(only(upgradeTotals, ['predator-fang', 'predator-hide', 'corrupted-beast-essence', 'predator-sinew'])).toEqual({ 'predator-fang': 503, 'predator-hide': 503, 'corrupted-beast-essence': 502, 'predator-sinew': 502 })
    expect(only(upgradeTotals, ['ossuary-remnant', 'soul-residue', 'graveglass-shard', 'burial-cloth'])).toEqual({ 'ossuary-remnant': 863, 'soul-residue': 863, 'graveglass-shard': 862, 'burial-cloth': 862 })
    expect(only(upgradeTotals, ['life-essence', 'prismatic-fragment'])).toEqual({ 'life-essence': 8777, 'prismatic-fragment': 1247 })
    expect(only(addTotals(recipeTotals, upgradeTotals), ['wisp-essence', 'thorn-fiber', 'rootstone-shard', 'grove-bark'])).toEqual({ 'wisp-essence': 365, 'thorn-fiber': 365, 'rootstone-shard': 365, 'grove-bark': 366 })
    expect(only(addTotals(recipeTotals, upgradeTotals), ['predator-fang', 'predator-hide', 'corrupted-beast-essence', 'predator-sinew'])).toEqual({ 'predator-fang': 543, 'predator-hide': 543, 'corrupted-beast-essence': 543, 'predator-sinew': 542 })
    expect(only(addTotals(recipeTotals, upgradeTotals), ['ossuary-remnant', 'soul-residue', 'graveglass-shard', 'burial-cloth'])).toEqual({ 'ossuary-remnant': 912, 'soul-residue': 912, 'graveglass-shard': 910, 'burial-cloth': 910 })
    expect(only(addTotals(recipeTotals, upgradeTotals), ['life-essence', 'prismatic-fragment'])).toEqual({ 'life-essence': 8961, 'prismatic-fragment': 1264 })
    expect(only(addTotals(recipeTotals, upgradeTotals), ['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'])).toEqual({ 'fire-fragment': 7320, 'water-fragment': 7364, 'earth-fragment': 7364, 'air-fragment': 7454 })
    expect(only(recipeTotals, ['heartseed', 'greatbear-core', 'edrin-remnant'])).toEqual({ heartseed: 8, 'greatbear-core': 8, 'edrin-remnant': 28 })
  })
})
