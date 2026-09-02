import { ITEMS } from '../items/items'
import type { DungeonId, ItemDefinition, ItemId } from '../../types'

/** Authored Equipment origin groups used by Dev Tools and future archive filters. */
export const EQUIPMENT_BY_DUNGEON: Record<DungeonId, readonly ItemId[]> = {
  'whispering-woods': ['ember-staff', 'wispwood-wand', 'tide-focus', 'stoneweave-robe', 'windthread-charm', 'wispveil-hood', 'grovekeeper-mantle', 'wispbound-ring', 'heartseed-necklace'],
  'howling-den': ['fangbound-dagger', 'fangbound-buckler', 'corrupted-howlstaff', 'razorclaw-circlet', 'predator-hide-mantle', 'greatbear-vestment', 'howling-signet', 'greatbear-heartstone'],
  'abandoned-catacombs': ['graveglass-wand', 'edrins-remnant-staff', 'soulward-focus', 'soulward-shield', 'acolyte-vestments', 'wraithveil-hood', 'ossuary-mantle', 'soulglass-amulet', 'gravebinder-ring', 'edrins-signet'],
}

export const EQUIPMENT_BOSS_RELIC_IDS: readonly ItemId[] = ['heartseed-necklace', 'greatbear-heartstone', 'edrins-signet']

const equipmentOrigin = new Map<ItemId, DungeonId>(Object.entries(EQUIPMENT_BY_DUNGEON).flatMap(([dungeonId, itemIds]) => itemIds.map((itemId) => [itemId, dungeonId as DungeonId])))

export const getEquipmentIdsForDungeon = (dungeonId: DungeonId) => EQUIPMENT_BY_DUNGEON[dungeonId]
export const getEquipmentOrigin = (itemId: ItemId) => equipmentOrigin.get(itemId) ?? null
export const isEquipmentBossRelic = (itemId: ItemId) => EQUIPMENT_BOSS_RELIC_IDS.includes(itemId)

export const validateEquipmentSetDefinitions = (items: Record<string, ItemDefinition> = ITEMS) => {
  const errors: string[] = []
  const listed = Object.entries(EQUIPMENT_BY_DUNGEON).flatMap(([dungeonId, itemIds]) => itemIds.map((itemId) => ({ dungeonId, itemId })))
  const counts = listed.reduce<Record<string, number>>((result, entry) => { result[entry.itemId] = (result[entry.itemId] ?? 0) + 1; return result }, {})
  listed.forEach(({ dungeonId, itemId }) => {
    if (!items[itemId]) errors.push(`${dungeonId}: unknown Equipment ${itemId}`)
    else if (items[itemId].kind !== 'equipment') errors.push(`${dungeonId}: ${itemId} is not Equipment`)
  })
  Object.entries(counts).forEach(([itemId, count]) => { if (count !== 1) errors.push(`${itemId}: Equipment must belong to exactly one dungeon set`) })
  Object.entries(items).filter(([, item]) => item.kind === 'equipment').forEach(([itemId]) => { if (!counts[itemId]) errors.push(`${itemId}: Equipment is missing from dungeon sets`) })
  EQUIPMENT_BOSS_RELIC_IDS.forEach((itemId) => { if (!items[itemId] || items[itemId].kind !== 'equipment') errors.push(`${itemId}: boss relic must be Equipment`); if (!counts[itemId]) errors.push(`${itemId}: boss relic is missing from dungeon sets`) })
  return errors
}
