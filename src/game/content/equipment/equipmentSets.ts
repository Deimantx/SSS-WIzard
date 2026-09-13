import { ARTIFACTS, isArtifactId } from '../artifacts/artifacts'
import { ITEMS } from '../items/items'
import type { DungeonId, ItemDefinition, ItemId } from '../../types'

/** Starter Artifacts are crafted progression items, not dungeon-origin Equipment. */
export const ARTIFACT_EQUIPMENT_IDS = [
  'ember-staff',
  'tideglass-wand',
  'stoneheart-scepter',
  'windthread-wand',
  'wispweave-robe',
  'wispveil-hood',
] as const satisfies readonly ItemId[]

/** Equipment that can be awarded directly by normal dungeon combat. */
export const DUNGEON_EQUIPMENT_BY_DUNGEON: Record<DungeonId, readonly ItemId[]> = {
  'whispering-woods': ['windthread-charm', 'grovekeeper-mantle', 'wispglass-earring', 'wispbound-ring', 'heartseed-necklace'],
  'howling-den': ['predator-hide-mantle', 'fangwire-earring', 'howling-signet', 'greatbear-heartstone'],
  'abandoned-catacombs': ['ossuary-mantle', 'mourning-glass-earring', 'gravebinder-ring', 'soulglass-amulet', 'edrins-signet'],
}

/** Boss-signature Equipment awarded directly by its assigned boss. */
export const BOSS_SIGNATURE_EQUIPMENT_IDS: readonly ItemId[] = ['heartseed-necklace', 'greatbear-heartstone', 'edrins-signet']

const equipmentOrigin = new Map<ItemId, DungeonId>(Object.entries(DUNGEON_EQUIPMENT_BY_DUNGEON).flatMap(([dungeonId, itemIds]) => itemIds.map((itemId): [ItemId, DungeonId] => [itemId, dungeonId as DungeonId])))
const artifactIds = new Set<ItemId>(ARTIFACT_EQUIPMENT_IDS)

export const getEquipmentIdsForDungeon = (dungeonId: DungeonId) => DUNGEON_EQUIPMENT_BY_DUNGEON[dungeonId]
export const getEquipmentOrigin = (itemId: ItemId) => equipmentOrigin.get(itemId) ?? null
export const isBossSignatureEquipment = (itemId: ItemId) => BOSS_SIGNATURE_EQUIPMENT_IDS.includes(itemId)

export const validateEquipmentSetDefinitions = (items: Record<string, ItemDefinition> = ITEMS) => {
  const errors: string[] = []
  const listed = Object.entries(DUNGEON_EQUIPMENT_BY_DUNGEON).flatMap(([dungeonId, itemIds]) => itemIds.map((itemId) => ({ dungeonId, itemId })))
  const counts = listed.reduce<Record<string, number>>((result, entry) => { result[entry.itemId] = (result[entry.itemId] ?? 0) + 1; return result }, {})

  listed.forEach(({ dungeonId, itemId }) => {
    if (!items[itemId]) errors.push(`${dungeonId}: unknown Equipment ${itemId}`)
    else if (items[itemId].kind !== 'equipment') errors.push(`${dungeonId}: ${itemId} is not Equipment`)
    if (artifactIds.has(itemId)) errors.push(`${itemId}: Artifact must not belong to a dungeon Equipment group`)
  })
  Object.entries(counts).forEach(([itemId, count]) => { if (count !== 1) errors.push(`${itemId}: Equipment must belong to exactly one dungeon set`) })
  Object.entries(items).filter(([, item]) => item.kind === 'equipment').forEach(([itemId]) => {
    const typedItemId = itemId as ItemId
    if (artifactIds.has(typedItemId)) {
      if (!isArtifactId(typedItemId) || !ARTIFACTS[typedItemId]) errors.push(`${itemId}: Artifact group contains an unknown Artifact`)
    } else if (counts[itemId] !== 1) errors.push(`${itemId}: non-Artifact Equipment must belong to exactly one dungeon set`)
  })
  ARTIFACT_EQUIPMENT_IDS.forEach((itemId) => {
    if (!items[itemId] || items[itemId].kind !== 'equipment') errors.push(`${itemId}: Artifact group entry must be Equipment`)
    if (counts[itemId]) errors.push(`${itemId}: Artifact must not be listed in a dungeon set`)
    if (!isArtifactId(itemId) || !ARTIFACTS[itemId]) errors.push(`${itemId}: Artifact group entry is missing from ARTIFACTS`)
  })
  BOSS_SIGNATURE_EQUIPMENT_IDS.forEach((itemId) => {
    if (!items[itemId] || items[itemId].kind !== 'equipment') errors.push(`${itemId}: boss signature must be Equipment`)
    if (counts[itemId] !== 1) errors.push(`${itemId}: boss signature must belong to exactly one dungeon set`)
  })
  return errors
}
