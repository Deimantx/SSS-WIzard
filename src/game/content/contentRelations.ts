import { DUNGEONS, DUNGEON_ORDER } from './dungeons/dungeons'
import { EQUIPMENT_BY_DUNGEON, getEquipmentOrigin } from './equipment/equipmentSets'
import { ITEMS } from './items/items'
import { MONSTERS, MONSTER_IDS } from './monsters'
import { RECIPES, RECIPE_ORDER } from './recipes/recipes'
import type { DungeonId, ItemId, MonsterId, RecipeId } from '../types'

/**
 * Read-only links between authored content registries.
 *
 * These relationships deliberately come from the content registries rather
 * than parsing player-facing source strings. Screens, Dev Tools, and the
 * balancing exporter can therefore answer the same "where did this come
 * from?" question without maintaining separate relationship tables.
 */
export interface ContentRelation {
  kind: 'dungeon' | 'monster' | 'recipe'
  id: DungeonId | MonsterId | RecipeId
  label: string
  detail: string
}

export interface ItemSourceInfo {
  itemId: ItemId
  authoredSource: string
  relations: readonly ContentRelation[]
}

export interface MonsterDungeonInfo {
  monsterId: MonsterId
  dungeonId: DungeonId
  dungeonName: string
  role: 'normal' | 'boss'
}

export interface ItemDropSource {
  itemId: ItemId
  monsterId: MonsterId
  monsterName: string
  dungeonId: DungeonId
  dungeonName: string
  role: 'normal' | 'boss'
  min: number
  max: number
  chance: number
}

/** Exact authored loot entries that can produce an item. */
export const getItemDropSources = (itemId: ItemId): ItemDropSource[] => DUNGEON_ORDER.flatMap((dungeonId) => {
  const dungeon = DUNGEONS[dungeonId]
  const monsterIds = [...dungeon.monsterPool, dungeon.boss]
  return monsterIds.flatMap((monsterId) => {
    const monster = MONSTERS[monsterId]
    return monster.loot.filter((drop) => drop.itemId === itemId).map((drop) => ({ monsterId, monsterName: monster.name, dungeonId, dungeonName: dungeon.name, role: dungeon.boss === monsterId ? 'boss' as const : 'normal' as const, ...drop, itemId }))
  })
})

const getItemRelations = (itemId: ItemId): ContentRelation[] => {
  const relations: ContentRelation[] = []
  const equipmentDungeon = getEquipmentOrigin(itemId)
  if (equipmentDungeon) {
    relations.push({ kind: 'dungeon', id: equipmentDungeon, label: DUNGEONS[equipmentDungeon].name, detail: 'Equipment set origin' })
  }

  getItemDropSources(itemId).forEach((drop) => relations.push({ kind: 'monster', id: drop.monsterId, label: drop.monsterName, detail: `${drop.dungeonName} ${drop.role} loot` }))

  RECIPE_ORDER.forEach((recipeId) => {
    const recipe = RECIPES[recipeId]
    if (recipe.output.itemId === itemId) {
      relations.push({ kind: 'recipe', id: recipeId, label: recipe.name, detail: 'Transmutation output' })
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
export const getMonsterDungeon = (monsterId: MonsterId): MonsterDungeonInfo | null => {
  for (const dungeonId of DUNGEON_ORDER) {
    const dungeon = DUNGEONS[dungeonId]
    if (dungeon.boss === monsterId) return { monsterId, dungeonId, dungeonName: dungeon.name, role: 'boss' }
    if (dungeon.monsterPool.includes(monsterId)) return { monsterId, dungeonId, dungeonName: dungeon.name, role: 'normal' }
  }
  return null
}

export const getEquipmentOriginDungeon = (itemId: ItemId) => getEquipmentOrigin(itemId)

/** Stable content graph entry point for consumers that need a single read model. */
export const buildContentRelations = () => ({
  itemSources: (itemId: ItemId) => getItemSourceInfo(itemId),
  itemRecipeUses: (itemId: ItemId) => getItemRecipeUses(itemId),
  monsterDungeon: (monsterId: MonsterId) => getMonsterDungeon(monsterId),
  equipmentOrigins: Object.fromEntries(Object.entries(EQUIPMENT_BY_DUNGEON).flatMap(([dungeonId, itemIds]) => itemIds.map((itemId) => [itemId, dungeonId]))),
  itemIds: Object.keys(ITEMS) as ItemId[],
  monsterIds: MONSTER_IDS,
})
