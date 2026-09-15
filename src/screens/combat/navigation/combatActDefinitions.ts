import type { CombatActDefinition, CombatActRouteSegment } from './combatActNavigationTypes'

const act0Nodes = [
  { id: 'whispering-woods', actId: 'act-0', x: 220, y: 250, kind: 'main', dungeonId: 'whispering-woods', tierLabel: 'TIER I' },
  { id: 'howling-den', actId: 'act-0', x: 660, y: 250, kind: 'main', dungeonId: 'howling-den', tierLabel: 'TIER I' },
  { id: 'abandoned-catacombs', actId: 'act-0', x: 1100, y: 250, kind: 'final', dungeonId: 'abandoned-catacombs', tierLabel: 'TIER I' },
] as const

const act1Nodes = [
  { id: 'fractured-approach', actId: 'act-1', x: 220, y: 430, kind: 'main', dungeonId: 'fractured-approach', tierLabel: 'TIER II', chapterId: 'chapter-i' },
  { id: 'flooded-reliquary', actId: 'act-1', x: 700, y: 290, kind: 'branch', dungeonId: 'flooded-reliquary', tierLabel: 'TIER II.2', chapterId: 'chapter-i' },
  { id: 'ashen-watch', actId: 'act-1', x: 700, y: 150, kind: 'branch', dungeonId: 'ashen-watch', tierLabel: 'TIER II.3', chapterId: 'chapter-i' },
  { id: 'rootscar-hollow', actId: 'act-1', x: 700, y: 690, kind: 'branch', dungeonId: 'rootscar-hollow', tierLabel: 'TIER II.4', chapterId: 'chapter-i' },
  { id: 'crossroads-of-ruin', actId: 'act-1', x: 700, y: 430, kind: 'main', dungeonId: 'crossroads-of-ruin', tierLabel: 'TIER II.5', chapterId: 'chapter-ii' },
  { id: 'graveglass-hollow', actId: 'act-1', x: 1180, y: 690, kind: 'branch', dungeonId: 'graveglass-hollow', tierLabel: 'TIER II.6', chapterId: 'chapter-ii' },
  { id: 'stormvault-gallery', actId: 'act-1', x: 1180, y: 300, kind: 'branch', dungeonId: 'stormvault-gallery', tierLabel: 'TIER II.7', chapterId: 'chapter-ii' },
  { id: 'starfallen-observatory', actId: 'act-1', x: 1180, y: 150, kind: 'branch', dungeonId: 'starfallen-observatory', tierLabel: 'TIER II.8', chapterId: 'chapter-ii' },
  { id: 'broken-meridian', actId: 'act-1', x: 1180, y: 430, kind: 'main', dungeonId: 'broken-meridian', tierLabel: 'TIER II.10', chapterId: 'chapter-iii' },
  { id: 'hall-of-unbound-names', actId: 'act-1', x: 1660, y: 250, kind: 'branch', dungeonId: 'hall-of-unbound-names', tierLabel: 'TIER II.11', chapterId: 'chapter-iii' },
  { id: 'vault-of-the-black-sigil', actId: 'act-1', x: 1660, y: 650, kind: 'branch', dungeonId: 'vault-of-the-black-sigil', tierLabel: 'TIER II.11', chapterId: 'chapter-iii' },
  { id: 'black-gate', actId: 'act-1', x: 2050, y: 430, kind: 'final', dungeonId: 'black-gate', tierLabel: 'TIER II.12', chapterId: 'chapter-iii' },
] as const

const MAIN_Y = 430
const act1RouteSegments: CombatActRouteSegment[] = [
  { id: 'main-t2-to-t25', x1: 315, y1: MAIN_Y, x2: 605, y2: MAIN_Y, kind: 'main', nodeIds: ['fractured-approach', 'crossroads-of-ruin'] },
  { id: 'main-t25-to-t210', x1: 795, y1: MAIN_Y, x2: 1085, y2: MAIN_Y, kind: 'main', nodeIds: ['crossroads-of-ruin', 'broken-meridian'] },
  { id: 'main-t210-to-t212', x1: 1275, y1: MAIN_Y, x2: 1930, y2: MAIN_Y, kind: 'main', nodeIds: ['broken-meridian', 'black-gate'], finalApproach: true },
  { id: 'first-upper-vertical', x1: 500, y1: 150, x2: 500, y2: MAIN_Y, kind: 'branch', nodeIds: ['ashen-watch', 'flooded-reliquary'] },
  { id: 'first-t23-stub', x1: 500, y1: 150, x2: 605, y2: 150, kind: 'branch', nodeIds: ['ashen-watch'] },
  { id: 'first-t22-stub', x1: 500, y1: 290, x2: 605, y2: 290, kind: 'branch', nodeIds: ['flooded-reliquary'] },
  { id: 'first-lower-vertical', x1: 545, y1: MAIN_Y, x2: 545, y2: 690, kind: 'branch', nodeIds: ['rootscar-hollow'] },
  { id: 'first-t24-stub', x1: 545, y1: 690, x2: 605, y2: 690, kind: 'branch', nodeIds: ['rootscar-hollow'] },
  { id: 'second-upper-vertical', x1: 980, y1: 150, x2: 980, y2: MAIN_Y, kind: 'branch', nodeIds: ['starfallen-observatory', 'stormvault-gallery'] },
  { id: 'second-t28-stub', x1: 980, y1: 150, x2: 1085, y2: 150, kind: 'branch', nodeIds: ['starfallen-observatory'] },
  { id: 'second-t27-stub', x1: 980, y1: 300, x2: 1085, y2: 300, kind: 'branch', nodeIds: ['stormvault-gallery'] },
  { id: 'second-lower-vertical', x1: 1025, y1: MAIN_Y, x2: 1025, y2: 690, kind: 'branch', nodeIds: ['graveglass-hollow'] },
  { id: 'second-t26-stub', x1: 1025, y1: 690, x2: 1085, y2: 690, kind: 'branch', nodeIds: ['graveglass-hollow'] },
  { id: 'final-vertical', x1: 1490, y1: 250, x2: 1490, y2: 650, kind: 'branch', nodeIds: ['hall-of-unbound-names', 'vault-of-the-black-sigil'] },
  { id: 'final-upper-t211-stub', x1: 1490, y1: 250, x2: 1565, y2: 250, kind: 'branch', nodeIds: ['hall-of-unbound-names'] },
  { id: 'final-lower-t211-stub', x1: 1490, y1: 650, x2: 1565, y2: 650, kind: 'branch', nodeIds: ['vault-of-the-black-sigil'] },
]

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
    routeSegments: act1RouteSegments,
    chapters: [],
  },
]

export const getCombatActDefinition = (actId: string) => COMBAT_ACT_DEFINITIONS.find((act) => act.id === actId)
