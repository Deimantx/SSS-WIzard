import type { DungeonId } from '../../types'

export type DungeonLootRole = 'normal' | 'boss'

export interface DungeonLootDefinition {
  artifactEssence: Record<DungeonLootRole, readonly [number, number]>
}

/** Authored material loot ranges. Finished Equipment never comes from combat loot. */
export const DUNGEON_LOOT = {
  'whispering-woods': { artifactEssence: { normal: [1, 2] as const, boss: [10, 15] as const } },
  'howling-den': { artifactEssence: { normal: [2, 3] as const, boss: [15, 20] as const } },
  'abandoned-catacombs': { artifactEssence: { normal: [3, 4] as const, boss: [20, 30] as const } },
  'fractured-approach': { artifactEssence: { normal: [4, 6] as const, boss: [30, 40] as const } },
  'flooded-reliquary': { artifactEssence: { normal: [5, 7] as const, boss: [35, 45] as const } },
  'ashen-watch': { artifactEssence: { normal: [5, 7] as const, boss: [35, 45] as const } },
  'rootscar-hollow': { artifactEssence: { normal: [5, 7] as const, boss: [35, 45] as const } },
  'crossroads-of-ruin': { artifactEssence: { normal: [6, 8] as const, boss: [45, 60] as const } },
  'graveglass-hollow': { artifactEssence: { normal: [7, 10] as const, boss: [55, 75] as const } },
  'stormvault-gallery': { artifactEssence: { normal: [7, 10] as const, boss: [55, 75] as const } },
  'starfallen-observatory': { artifactEssence: { normal: [7, 10] as const, boss: [55, 75] as const } },
  'broken-meridian': { artifactEssence: { normal: [10, 13] as const, boss: [80, 100] as const } },
  'hall-of-unbound-names': { artifactEssence: { normal: [12, 16] as const, boss: [100, 125] as const } },
  'vault-of-the-black-sigil': { artifactEssence: { normal: [12, 16] as const, boss: [100, 125] as const } },
  'black-gate': { artifactEssence: { normal: [15, 20] as const, boss: [140, 180] as const } },
} satisfies Record<DungeonId, DungeonLootDefinition>
