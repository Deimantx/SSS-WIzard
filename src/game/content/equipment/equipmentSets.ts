import { ARTIFACTS, isArtifactId } from '../artifacts/artifacts'
import { ITEMS } from '../items/items'
import type { DungeonId, ItemDefinition, ItemId } from '../../types'

/** The only finished Equipment content is the permanent Artifact roster. */
export const ARTIFACT_EQUIPMENT_IDS = [
  'ember-staff',
  'tideglass-wand',
  'stoneheart-scepter',
  'windthread-wand',
  'wispweave-robe',
  'wispveil-hood',
  'galeshard-staff',
  'reliquary-scepter',
  'pyrebound-staff',
  'rootheart-scepter',
  'convergence-robe',
  'waystone-circlet',
] as const satisfies readonly ItemId[]

/** Dungeon origin is intentionally empty: combat awards materials, not gear. */
export const getEquipmentOrigin = (_itemId: ItemId): DungeonId | null => null
export const getEquipmentIdsForDungeon = (_dungeonId: DungeonId): readonly ItemId[] => []

export const validateEquipmentSetDefinitions = (items: Record<string, ItemDefinition> = ITEMS) => {
  const errors: string[] = []
  const artifactIds = new Set<ItemId>(ARTIFACT_EQUIPMENT_IDS)
  ARTIFACT_EQUIPMENT_IDS.forEach((itemId) => {
    if (!items[itemId] || items[itemId].kind !== 'equipment') errors.push(`${itemId}: Artifact group entry must be Equipment`)
    if (!isArtifactId(itemId) || !ARTIFACTS[itemId]) errors.push(`${itemId}: Artifact group entry is missing from ARTIFACTS`)
  })
  Object.entries(items).forEach(([itemId, item]) => {
    if (item.kind === 'equipment' && !artifactIds.has(itemId as ItemId)) errors.push(`${itemId}: non-Artifact Equipment is not allowed`)
  })
  return errors
}
