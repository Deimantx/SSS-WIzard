import type { DungeonId } from '../../types'
import { DUNGEON_LOOT, type DungeonLootRole } from './dungeonLootConfig'

export { DUNGEON_LOOT, type DungeonLootRole } from './dungeonLootConfig'

export const getDungeonArtifactEssenceRange = (dungeonId: DungeonId, role: DungeonLootRole) => DUNGEON_LOOT[dungeonId].artifactEssence[role]

export const validateDungeonLootDefinitions = () => {
  const errors: string[] = []
  Object.entries(DUNGEON_LOOT).forEach(([dungeonId, loot]) => {
    const normal = loot.artifactEssence.normal
    const boss = loot.artifactEssence.boss
    if (!Number.isFinite(normal[0]) || !Number.isFinite(normal[1]) || normal[0] < 1 || normal[1] < normal[0] || !Number.isFinite(boss[0]) || !Number.isFinite(boss[1]) || boss[0] < 1 || boss[1] < boss[0] || boss[0] <= normal[0] || boss[1] <= normal[1]) errors.push(`${dungeonId}: boss Artifact Essence range must exceed normal range`)
  })
  return errors
}
