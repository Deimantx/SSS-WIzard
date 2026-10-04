import { COMBAT_LOCATIONS, COMBAT_LOCATION_ORDER, hasBossEncounter } from './combat-locations/worldNavigation'
import { ITEMS } from './items/items'
import { MONSTERS, MONSTER_IDS } from './monsters'
import { isArtificingRecipe, RECIPES, RECIPE_ORDER } from './recipes/recipes'
import type { CombatLocationId, ItemId, MonsterId, RecipeId } from '../types'

/**
 * Read-only links between authored content registries.
 *
 * These relationships deliberately come from the content registries rather
 * than parsing player-facing source strings. Screens, Dev Tools, and the
 * balancing exporter can therefore answer the same "where did this come
 * from?" question without maintaining separate relationship tables.
 */
export interface ContentRelation {
  kind: 'monster' | 'recipe'
  id: CombatLocationId | MonsterId | RecipeId
  label: string
  detail: string
}

export interface ItemSourceInfo {
  itemId: ItemId
  authoredSource: string
  relations: readonly ContentRelation[]
}

export interface MonsterLocationInfo {
  monsterId: MonsterId
  locationId: CombatLocationId
  locationName: string
  role: 'normal' | 'boss'
}

export interface ItemDropSource {
  itemId: ItemId
  monsterId: MonsterId
  monsterName: string
  locationId: CombatLocationId
  locationName: string
  role: 'normal' | 'boss'
  min: number
  max: number
  chance: number
}

/** Exact authored loot entries that can produce an item. */
export const getItemDropSources = (itemId: ItemId): ItemDropSource[] => COMBAT_LOCATION_ORDER.flatMap((locationId) => {
  const dungeon = COMBAT_LOCATIONS[locationId]
  const monsterIds = [...dungeon.monsterPool, ...(hasBossEncounter(dungeon) ? [dungeon.boss] : [])]
  return monsterIds.flatMap((monsterId) => {
    const monster = MONSTERS[monsterId]
    return monster.loot.filter((drop) => drop.itemId === itemId).map((drop) => ({ monsterId, monsterName: monster.name, locationId, locationName: dungeon.name, role: dungeon.boss === monsterId ? 'boss' as const : 'normal' as const, min: drop.quantity.min, max: drop.quantity.max, chance: drop.baseChance, itemId }))
  })
})

const getItemRelations = (itemId: ItemId): ContentRelation[] => {
  const relations: ContentRelation[] = []
  getItemDropSources(itemId).forEach((drop) => relations.push({ kind: 'monster', id: drop.monsterId, label: drop.monsterName, detail: `${drop.locationName} ${drop.role} loot` }))

  RECIPE_ORDER.forEach((recipeId) => {
    const recipe = RECIPES[recipeId]
    if (recipe.output.itemId === itemId) {
      relations.push({ kind: 'recipe', id: recipeId, label: recipe.name, detail: isArtificingRecipe(recipe) ? 'Artificing output' : 'Transmutation output' })
    }
  })
  return relations
}

/** Return authored and derived source relationships for one item. */
export const getItemSourceInfo = (itemId: ItemId): ItemSourceInfo => {
  return { itemId, authoredSource: ITEMS[itemId].source, relations: getItemRelations(itemId) }
}

export const getItemSources = (itemId: ItemId) => getItemSourceInfo(itemId).relations

/** Recipes that consume the item as an ingredient. */
export const getItemRecipeUses = (itemId: ItemId) => RECIPE_ORDER.flatMap((recipeId) => {
  const recipe = RECIPES[recipeId]
  return recipe.ingredients.some((ingredient) => ingredient.itemId === itemId) ? [recipe] : []
})

/** Every authored dungeon association for a monster, including its boss role. */
export const getMonsterCombatLocation = (monsterId: MonsterId): MonsterLocationInfo | null => {
  for (const locationId of COMBAT_LOCATION_ORDER) {
    const dungeon = COMBAT_LOCATIONS[locationId]
    if (hasBossEncounter(dungeon) && dungeon.boss === monsterId) return { monsterId, locationId, locationName: dungeon.name, role: 'boss' }
    if (dungeon.sequenceBossIds?.includes(monsterId)) return { monsterId, locationId, locationName: dungeon.name, role: 'boss' }
    if (dungeon.monsterPool.includes(monsterId)) return { monsterId, locationId, locationName: dungeon.name, role: 'normal' }
  }
  return null
}

/** Stable content graph entry point for consumers that need a single read model. */
export const buildContentRelations = () => ({
  itemSources: (itemId: ItemId) => getItemSourceInfo(itemId),
  itemRecipeUses: (itemId: ItemId) => getItemRecipeUses(itemId),
  monsterCombatLocation: (monsterId: MonsterId) => getMonsterCombatLocation(monsterId),
  itemIds: Object.keys(ITEMS) as ItemId[],
  monsterIds: MONSTER_IDS,
})
