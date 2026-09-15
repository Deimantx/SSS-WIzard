import type { DungeonId, ItemId } from '../../types'

export type DungeonLootRole = 'normal' | 'boss'

export interface DungeonLootDefinition {
  regularEquipment: readonly ItemId[]
  bossSignature: ItemId
  artifactEssence: Record<DungeonLootRole, readonly [number, number]>
}

/**
 * The authored area-loot source. Runtime loot, equipment-origin views, and
 * campaign presentation should all derive from this configuration.
 */
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
  'fractured-approach': {
    regularEquipment: ['galeglass-earring', 'riftwind-ring', 'waystone-pendant', 'fractured-ward-mantle'] as const,
    bossSignature: 'gatekeeper-sigil',
    artifactEssence: { normal: [4, 6] as const, boss: [30, 40] as const },
  },
  'flooded-reliquary': { regularEquipment: ['mistglass-earring', 'reliquary-ring', 'drowned-chain-pendant'] as const, bossSignature: 'keepers-tide-seal', artifactEssence: { normal: [5, 7] as const, boss: [35, 45] as const } },
  'ashen-watch': { regularEquipment: ['cinderwire-earring', 'ashbrand-ring', 'emberwatch-mantle'] as const, bossSignature: 'revenant-emberstone', artifactEssence: { normal: [5, 7] as const, boss: [35, 45] as const } },
  'rootscar-hollow': { regularEquipment: ['briar-earring', 'rootbound-ring', 'mossguard-mantle'] as const, bossSignature: 'ancient-heart-knot', artifactEssence: { normal: [5, 7] as const, boss: [35, 45] as const } },
  'crossroads-of-ruin': { regularEquipment: ['wayfarer-earring', 'crossroads-signet', 'confluence-pendant'] as const, bossSignature: 'keepers-roadseal', artifactEssence: { normal: [6, 8] as const, boss: [45, 60] as const } },
  'graveglass-hollow': { regularEquipment: ['graveglass-earring', 'shardbone-ring', 'mourner-veil-mantle'] as const, bossSignature: 'behemoth-heartshard', artifactEssence: { normal: [7, 10] as const, boss: [55, 75] as const } },
  'stormvault-gallery': { regularEquipment: ['voltglass-earring', 'stormcoil-ring', 'gale-scribe-pendant'] as const, bossSignature: 'archivists-conductor', artifactEssence: { normal: [7, 10] as const, boss: [55, 75] as const } },
  'starfallen-observatory': { regularEquipment: ['starfall-ring', 'lenskeeper-earring', 'astral-pendant'] as const, bossSignature: 'fallen-astromancer-lens', artifactEssence: { normal: [7, 10] as const, boss: [55, 75] as const } },
  'broken-meridian': { regularEquipment: ['meridian-ring', 'linebreaker-earring', 'fractured-conduit-pendant', 'leyline-mantle'] as const, bossSignature: 'splitters-meridian-core', artifactEssence: { normal: [10, 13] as const, boss: [80, 100] as const } },
  'hall-of-unbound-names': { regularEquipment: ['nameless-ring', 'whisper-earring', 'unbound-seal-pendant'] as const, bossSignature: 'prelates-unspoken-seal', artifactEssence: { normal: [12, 16] as const, boss: [100, 125] as const } },
  'vault-of-the-black-sigil': { regularEquipment: ['black-sigil-ring', 'inkbound-earring', 'vaultseal-mantle'] as const, bossSignature: 'wardens-black-sigil', artifactEssence: { normal: [12, 16] as const, boss: [100, 125] as const } },
  'black-gate': { regularEquipment: ['gatebound-ring', 'portal-echo-earring', 'blackgate-pendant', 'voidward-mantle'] as const, bossSignature: 'black-gatekeepers-seal', artifactEssence: { normal: [15, 20] as const, boss: [140, 180] as const } },
} satisfies Record<DungeonId, DungeonLootDefinition>

export const REGULAR_EQUIPMENT_LOOT_CHANCE = 0.01
export const BOSS_REGULAR_EQUIPMENT_LOOT_CHANCE = 0.05
export const BOSS_SIGNATURE_EQUIPMENT_LOOT_CHANCE = 0.1
