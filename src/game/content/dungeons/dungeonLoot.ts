import type { DungeonId } from '../../types'
import { isArtifactId } from '../artifacts/artifacts'
import { ITEMS } from '../items/items'
import {
  BOSS_REGULAR_EQUIPMENT_LOOT_CHANCE,
  BOSS_SIGNATURE_EQUIPMENT_LOOT_CHANCE,
  DUNGEON_LOOT,
  REGULAR_EQUIPMENT_LOOT_CHANCE,
  type DungeonLootRole,
} from './dungeonLootConfig'

export {
  BOSS_REGULAR_EQUIPMENT_LOOT_CHANCE,
  BOSS_SIGNATURE_EQUIPMENT_LOOT_CHANCE,
  DUNGEON_LOOT,
  REGULAR_EQUIPMENT_LOOT_CHANCE,
  type DungeonLootRole,
} from './dungeonLootConfig'

export const getDungeonRegularEquipment = (dungeonId: DungeonId) => DUNGEON_LOOT[dungeonId].regularEquipment
export const getDungeonArtifactEssenceRange = (dungeonId: DungeonId, role: DungeonLootRole) => DUNGEON_LOOT[dungeonId].artifactEssence[role]
export const getDungeonBossSignature = (dungeonId: DungeonId) => DUNGEON_LOOT[dungeonId].bossSignature

export const validateDungeonLootDefinitions = () => {
  const errors: string[] = []
  Object.entries(DUNGEON_LOOT).forEach(([dungeonId, loot]) => {
    const regularIds = new Set(loot.regularEquipment)
    if (regularIds.size !== loot.regularEquipment.length) errors.push(`${dungeonId}: regular Equipment pool contains duplicates`)
    loot.regularEquipment.forEach((itemId) => {
      if (ITEMS[itemId]?.kind !== 'equipment') errors.push(`${dungeonId}: regular loot must be Equipment: ${itemId}`)
      if (isArtifactId(itemId)) errors.push(`${dungeonId}: regular loot may not contain an Artifact: ${itemId}`)
      if ((itemId as string) === loot.bossSignature) errors.push(`${dungeonId}: boss signature is duplicated in regularEquipment`)
    })
    if (ITEMS[loot.bossSignature]?.kind !== 'equipment') errors.push(`${dungeonId}: boss signature must be Equipment: ${loot.bossSignature}`)
    if (isArtifactId(loot.bossSignature)) errors.push(`${dungeonId}: boss signature may not be an Artifact: ${loot.bossSignature}`)
    const normal = loot.artifactEssence.normal
    const boss = loot.artifactEssence.boss
    if (!Number.isFinite(normal[0]) || !Number.isFinite(normal[1]) || normal[0] < 1 || normal[1] < normal[0] || !Number.isFinite(boss[0]) || !Number.isFinite(boss[1]) || boss[0] < 1 || boss[1] < boss[0] || boss[0] <= normal[0] || boss[1] <= normal[1]) errors.push(`${dungeonId}: boss Artifact Essence range must exceed normal range`)
  })
  const validProbability = (value: number) => Number.isFinite(value) && value > 0 && value <= 1
  if (![REGULAR_EQUIPMENT_LOOT_CHANCE, BOSS_REGULAR_EQUIPMENT_LOOT_CHANCE, BOSS_SIGNATURE_EQUIPMENT_LOOT_CHANCE].every(validProbability)) errors.push('invalid dungeon equipment loot chances')
  if (!(BOSS_REGULAR_EQUIPMENT_LOOT_CHANCE > REGULAR_EQUIPMENT_LOOT_CHANCE)) errors.push('boss regular Equipment chance must exceed normal regular Equipment chance')
  return errors
}
