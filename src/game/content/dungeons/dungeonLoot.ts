import type { DungeonId, ItemId } from '../../types'

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
