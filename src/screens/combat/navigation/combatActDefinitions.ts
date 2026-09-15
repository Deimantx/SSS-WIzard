import type { CombatActDefinition } from './combatActNavigationTypes'

const act0Nodes = [
  { id: 'whispering-woods', actId: 'act-0', x: 220, y: 250, kind: 'main', dungeonId: 'whispering-woods', tierLabel: 'TIER I' },
  { id: 'howling-den', actId: 'act-0', x: 660, y: 250, kind: 'main', dungeonId: 'howling-den', tierLabel: 'TIER I' },
  { id: 'abandoned-catacombs', actId: 'act-0', x: 1100, y: 250, kind: 'final', dungeonId: 'abandoned-catacombs', tierLabel: 'TIER I' },
] as const

const act1Nodes = [
  { id: 'fractured-approach', actId: 'act-1', x: 180, y: 430, kind: 'main', dungeonId: 'fractured-approach', tierLabel: 'TIER II', chapterId: 'chapter-i' },
  { id: 'flooded-reliquary', actId: 'act-1', name: 'Flooded Reliquary', description: 'The first branch beyond Fractured Approach. Its dungeon content is not authored yet.', x: 450, y: 170, kind: 'branch', dungeonId: null, tierLabel: 'TIER II / BRANCH', chapterId: 'chapter-i', prototype: true, requiresDungeonCompletion: 'fractured-approach' },
  { id: 'ashen-watch', actId: 'act-1', name: 'Ashen Watch', description: 'The second branch beyond Fractured Approach. Its dungeon content is not authored yet.', x: 450, y: 430, kind: 'branch', dungeonId: null, tierLabel: 'TIER II / BRANCH', chapterId: 'chapter-i', prototype: true, requiresDungeonCompletion: 'fractured-approach' },
  { id: 'rootscar-hollow', actId: 'act-1', name: 'Rootscar Hollow', description: 'The third branch beyond Fractured Approach. Its dungeon content is not authored yet.', x: 450, y: 690, kind: 'branch', dungeonId: null, tierLabel: 'TIER II / BRANCH', chapterId: 'chapter-i', prototype: true, requiresDungeonCompletion: 'fractured-approach' },
  { id: 'prototype-area-05', actId: 'act-1', name: 'Prototype Area 05', description: 'A future Act 1 convergence route. Its dungeon content is not authored yet.', x: 850, y: 430, kind: 'main', dungeonId: null, tierLabel: 'TIER II / PROTOTYPE', chapterId: 'chapter-ii', prototype: true },
  { id: 'prototype-area-06', actId: 'act-1', name: 'Prototype Area 06', description: 'A future Act 1 branch route. Its dungeon content is not authored yet.', x: 900, y: 170, kind: 'branch', dungeonId: null, tierLabel: 'TIER II / PROTOTYPE', chapterId: 'chapter-ii', prototype: true },
  { id: 'prototype-area-07', actId: 'act-1', name: 'Prototype Area 07', description: 'A future Act 1 branch route. Its dungeon content is not authored yet.', x: 950, y: 700, kind: 'branch', dungeonId: null, tierLabel: 'TIER II / PROTOTYPE', chapterId: 'chapter-ii', prototype: true },
  { id: 'prototype-area-08', actId: 'act-1', name: 'Prototype Area 08', description: 'A future Act 1 route. Its dungeon content is not authored yet.', x: 1260, y: 430, kind: 'main', dungeonId: null, tierLabel: 'TIER II / PROTOTYPE', chapterId: 'chapter-iii', prototype: true },
  { id: 'prototype-area-09', actId: 'act-1', name: 'Prototype Area 09', description: 'A future Act 1 branch route. Its dungeon content is not authored yet.', x: 1370, y: 180, kind: 'branch', dungeonId: null, tierLabel: 'TIER II / PROTOTYPE', chapterId: 'chapter-iii', prototype: true },
  { id: 'prototype-finale-10', actId: 'act-1', name: 'Prototype Finale 10', description: 'The future Act 1 finale. Its dungeon content is not authored yet.', x: 1710, y: 430, kind: 'final', dungeonId: null, tierLabel: 'TIER II / PROTOTYPE', chapterId: 'chapter-iii', prototype: true },
] as const

export const COMBAT_ACT_DEFINITIONS: readonly CombatActDefinition[] = [
  {
    id: 'act-0', label: 'ACT 0', title: 'PROLOGUE', subtitle: 'THE FIRST FRONTIER', description: 'Follow the living leyline from the tower to the forgotten depths.',
    unlock: { type: 'always' }, stage: { width: 1320, height: 500 }, nodes: [...act0Nodes],
    connections: [{ from: 'whispering-woods', to: 'howling-den', kind: 'main' }, { from: 'howling-den', to: 'abandoned-catacombs', kind: 'main' }],
  },
  {
    id: 'act-1', label: 'ACT 1', title: 'THE SHATTERED FRONTIER', subtitle: 'FRACTURED APPROACH', description: 'Cross the Fractured Approach. Its first boss-clear opens the three next branch routes for the following Act 1 phase.',
    unlock: { type: 'boss-kill', bossId: 'archmage-edrin-shade', kills: 1 }, stage: { width: 2000, height: 860 }, nodes: [...act1Nodes],
    connections: [
      { from: 'fractured-approach', to: 'prototype-area-05', kind: 'main' },
      { from: 'prototype-area-05', to: 'prototype-area-08', kind: 'main' }, { from: 'prototype-area-08', to: 'prototype-finale-10', kind: 'main' },
      { from: 'fractured-approach', to: 'flooded-reliquary', kind: 'branch' }, { from: 'fractured-approach', to: 'ashen-watch', kind: 'branch' }, { from: 'fractured-approach', to: 'rootscar-hollow', kind: 'branch' },
      { from: 'prototype-area-05', to: 'prototype-area-06', kind: 'branch' }, { from: 'prototype-area-05', to: 'prototype-area-07', kind: 'branch' },
      { from: 'prototype-area-08', to: 'prototype-area-09', kind: 'branch' },
    ],
    chapters: [{ id: 'chapter-i', label: 'CHAPTER I', startX: 100, endX: 620 }, { id: 'chapter-ii', label: 'CHAPTER II', startX: 700, endX: 1190 }, { id: 'chapter-iii', label: 'CHAPTER III', startX: 1270, endX: 1900 }],
  },
]

export const getCombatActDefinition = (actId: string) => COMBAT_ACT_DEFINITIONS.find((act) => act.id === actId)
