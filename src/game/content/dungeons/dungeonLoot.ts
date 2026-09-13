import type { DungeonId, ItemId } from '../../types'
import { isArtifactId } from '../artifacts/artifacts'
import { ITEMS } from '../items/items'

export type DungeonLootRole = 'normal' | 'boss'

export const DUNGEON_LOOT = {
  'whispering-woods': {
    regularEquipment: ['windthread-charm', 'wispglass-earring', 'wispbound-ring', 'grovekeeper-mantle'] as const,
    bossSignature: 'heartseed-necklace',
    artifactEssence: { normal: [1, 2] as const, boss: [10, 15] as const },
  },
  'howling-den': {
    regularEquipment: ['predator-hide-mantle', 'fangwire-earring', 'howling-signet'] as const,
    bossSignature: 'greatbear-heartstone',
    artifactEssence: { normal: [2, 3] as const, boss: [15, 20] as const },
  },
  'abandoned-catacombs': {
    regularEquipment: ['ossuary-mantle', 'mourning-glass-earring', 'gravebinder-ring', 'soulglass-amulet'] as const,
    bossSignature: 'edrins-signet',
    artifactEssence: { normal: [3, 4] as const, boss: [20, 30] as const },
  },
} satisfies Record<DungeonId, { regularEquipment: readonly ItemId[]; bossSignature: ItemId; artifactEssence: Record<DungeonLootRole, readonly [number, number]> }>

export const REGULAR_EQUIPMENT_LOOT_CHANCE = 0.01
export const BOSS_REGULAR_EQUIPMENT_LOOT_CHANCE = 0.05
export const BOSS_SIGNATURE_EQUIPMENT_LOOT_CHANCE = 0.1

export const getDungeonRegularEquipment = (dungeonId: DungeonId) => DUNGEON_LOOT[dungeonId].regularEquipment
export const getDungeonArtifactEssenceRange = (dungeonId: DungeonId, role: DungeonLootRole) => DUNGEON_LOOT[dungeonId].artifactEssence[role]
export const getDungeonBossSignature = (dungeonId: DungeonId) => DUNGEON_LOOT[dungeonId].bossSignature

export const validateDungeonLootDefinitions = () => {
  const errors: string[] = []
  Object.entries(DUNGEON_LOOT).forEach(([dungeonId, loot]) => {
    loot.regularEquipment.forEach((itemId) => {
      if (ITEMS[itemId]?.kind !== 'equipment') errors.push(`${dungeonId}: regular loot must be Equipment: ${itemId}`)
      if (isArtifactId(itemId)) errors.push(`${dungeonId}: regular loot may not contain an Artifact: ${itemId}`)
    })
    if (loot.regularEquipment.some((itemId) => (itemId as ItemId) === loot.bossSignature)) errors.push(`${dungeonId}: boss signature is duplicated in regularEquipment`)
    if (ITEMS[loot.bossSignature]?.kind !== 'equipment') errors.push(`${dungeonId}: boss signature must be Equipment: ${loot.bossSignature}`)
    const normal = loot.artifactEssence.normal
    const boss = loot.artifactEssence.boss
    if (normal[0] < 1 || normal[1] < normal[0] || boss[0] < 1 || boss[1] < boss[0] || boss[0] <= normal[0] || boss[1] <= normal[1]) errors.push(`${dungeonId}: boss Artifact Essence range must exceed normal range`)
  })
  if (REGULAR_EQUIPMENT_LOOT_CHANCE <= 0 || BOSS_REGULAR_EQUIPMENT_LOOT_CHANCE <= REGULAR_EQUIPMENT_LOOT_CHANCE || BOSS_SIGNATURE_EQUIPMENT_LOOT_CHANCE <= 0) errors.push('invalid dungeon equipment loot chances')
  return errors
}
