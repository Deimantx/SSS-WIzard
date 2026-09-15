import type { CombatActDefinition } from './combatActNavigationTypes'

const act0Nodes = [
  { id: 'whispering-woods', actId: 'act-0', x: 220, y: 250, kind: 'main', dungeonId: 'whispering-woods', tierLabel: 'TIER I' },
  { id: 'howling-den', actId: 'act-0', x: 660, y: 250, kind: 'main', dungeonId: 'howling-den', tierLabel: 'TIER I' },
  { id: 'abandoned-catacombs', actId: 'act-0', x: 1100, y: 250, kind: 'final', dungeonId: 'abandoned-catacombs', tierLabel: 'TIER I' },
] as const

const act1Nodes = [
  { id: 'fractured-approach', actId: 'act-1', x: 180, y: 430, kind: 'main', dungeonId: 'fractured-approach', tierLabel: 'TIER II', chapterId: 'chapter-i' },
  { id: 'flooded-reliquary', actId: 'act-1', x: 450, y: 430, kind: 'branch', dungeonId: 'flooded-reliquary', tierLabel: 'TIER II.2', chapterId: 'chapter-i' },
  { id: 'ashen-watch', actId: 'act-1', x: 450, y: 170, kind: 'branch', dungeonId: 'ashen-watch', tierLabel: 'TIER II.3', chapterId: 'chapter-i' },
  { id: 'rootscar-hollow', actId: 'act-1', x: 450, y: 690, kind: 'branch', dungeonId: 'rootscar-hollow', tierLabel: 'TIER II.4', chapterId: 'chapter-i' },
  { id: 'crossroads-of-ruin', actId: 'act-1', x: 820, y: 430, kind: 'main', dungeonId: 'crossroads-of-ruin', tierLabel: 'TIER II.5', chapterId: 'chapter-ii' },
  { id: 'graveglass-hollow', actId: 'act-1', x: 1090, y: 690, kind: 'branch', dungeonId: 'graveglass-hollow', tierLabel: 'TIER II.6', chapterId: 'chapter-ii' },
  { id: 'stormvault-gallery', actId: 'act-1', x: 1090, y: 430, kind: 'branch', dungeonId: 'stormvault-gallery', tierLabel: 'TIER II.7', chapterId: 'chapter-ii' },
  { id: 'starfallen-observatory', actId: 'act-1', x: 1090, y: 170, kind: 'branch', dungeonId: 'starfallen-observatory', tierLabel: 'TIER II.8', chapterId: 'chapter-ii' },
  { id: 'broken-meridian', actId: 'act-1', x: 1460, y: 430, kind: 'main', dungeonId: 'broken-meridian', tierLabel: 'TIER II.10', chapterId: 'chapter-iii' },
  { id: 'hall-of-unbound-names', actId: 'act-1', x: 1720, y: 250, kind: 'branch', dungeonId: 'hall-of-unbound-names', tierLabel: 'TIER II.11', chapterId: 'chapter-iii' },
  { id: 'vault-of-the-black-sigil', actId: 'act-1', x: 1720, y: 610, kind: 'branch', dungeonId: 'vault-of-the-black-sigil', tierLabel: 'TIER II.11', chapterId: 'chapter-iii' },
  { id: 'black-gate', actId: 'act-1', x: 2010, y: 430, kind: 'final', dungeonId: 'black-gate', tierLabel: 'TIER II.12', chapterId: 'chapter-iii' },
] as const

export const COMBAT_ACT_DEFINITIONS: readonly CombatActDefinition[] = [
  {
    id: 'act-0', label: 'ACT 0', title: 'PROLOGUE', subtitle: 'THE FIRST FRONTIER', description: 'Follow the living leyline from the tower to the forgotten depths.',
    unlock: { type: 'always' }, stage: { width: 1320, height: 500 }, nodes: [...act0Nodes],
    connections: [{ from: 'whispering-woods', to: 'howling-den', kind: 'main' }, { from: 'howling-den', to: 'abandoned-catacombs', kind: 'main' }],
  },
  {
    id: 'act-1', label: 'ACT 1', title: 'THE SHATTERED FRONTIER', subtitle: 'FRACTURED APPROACH', description: 'Cross the broken meridian and restore the path to the Black Gate.',
    unlock: { type: 'boss-kill', bossId: 'archmage-edrin-shade', kills: 1 }, stage: { width: 2200, height: 860 }, nodes: [...act1Nodes],
    connections: [
      { from: 'fractured-approach', to: 'crossroads-of-ruin', kind: 'main' }, { from: 'crossroads-of-ruin', to: 'broken-meridian', kind: 'main' }, { from: 'broken-meridian', to: 'black-gate', kind: 'main' },
    ],
    branchRails: [
      { id: 'act1-frontier-branch-rail', x: 330, y1: 170, y2: 690, anchor: { nodeId: 'fractured-approach', y: 430 }, stubs: [{ nodeId: 'ashen-watch', y: 170 }, { nodeId: 'flooded-reliquary', y: 430 }, { nodeId: 'rootscar-hollow', y: 690 }] },
      { id: 'act1-ruined-gallery-rail', x: 950, y1: 170, y2: 690, anchor: { nodeId: 'crossroads-of-ruin', y: 430 }, stubs: [{ nodeId: 'starfallen-observatory', y: 170 }, { nodeId: 'stormvault-gallery', y: 430 }, { nodeId: 'graveglass-hollow', y: 690 }] },
      { id: 'act1-black-gate-branch-rail', x: 1600, y1: 250, y2: 610, anchor: { nodeId: 'broken-meridian', y: 430 }, stubs: [{ nodeId: 'hall-of-unbound-names', y: 250 }, { nodeId: 'vault-of-the-black-sigil', y: 610 }] },
    ],
    chapters: [{ id: 'chapter-i', label: 'CHAPTER I', startX: 100, endX: 620 }, { id: 'chapter-ii', label: 'CHAPTER II', startX: 700, endX: 1190 }, { id: 'chapter-iii', label: 'CHAPTER III', startX: 1270, endX: 2120 }],
  },
]

export const getCombatActDefinition = (actId: string) => COMBAT_ACT_DEFINITIONS.find((act) => act.id === actId)
