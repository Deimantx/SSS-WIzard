import type { CombatActDefinition } from './combatActNavigationTypes'

const act0Nodes = [
  { id: 'whispering-woods', actId: 'act-0', x: 180, y: 230, kind: 'main', dungeonId: 'whispering-woods', tierLabel: 'TIER I' },
  { id: 'howling-den', actId: 'act-0', x: 500, y: 230, kind: 'main', dungeonId: 'howling-den', tierLabel: 'TIER I' },
  { id: 'abandoned-catacombs', actId: 'act-0', x: 820, y: 230, kind: 'final', dungeonId: 'abandoned-catacombs', tierLabel: 'TIER I' },
] as const

const act1Nodes = [
  { id: 'prototype-area-01', actId: 'act-1', name: 'Prototype Area 01', description: 'Temporary navigation prototype used to validate future Act structure.', x: 120, y: 320, kind: 'main', dungeonId: null, tierLabel: 'TIER II · PROTOTYPE', chapterId: 'chapter-i', prototype: true },
  { id: 'prototype-area-02', actId: 'act-1', name: 'Prototype Area 02', description: 'Temporary navigation prototype used to validate future Act structure.', x: 300, y: 165, kind: 'branch', dungeonId: null, tierLabel: 'TIER II · PROTOTYPE', chapterId: 'chapter-i', prototype: true },
  { id: 'prototype-area-03', actId: 'act-1', name: 'Prototype Area 03', description: 'Temporary navigation prototype used to validate future Act structure.', x: 320, y: 320, kind: 'main', dungeonId: null, tierLabel: 'TIER II · PROTOTYPE', chapterId: 'chapter-i', prototype: true },
  { id: 'prototype-area-04', actId: 'act-1', name: 'Prototype Area 04', description: 'Temporary navigation prototype used to validate future Act structure.', x: 350, y: 490, kind: 'branch', dungeonId: null, tierLabel: 'TIER II · PROTOTYPE', chapterId: 'chapter-i', prototype: true },
  { id: 'prototype-area-05', actId: 'act-1', name: 'Prototype Area 05', description: 'Temporary navigation prototype used to validate future Act structure.', x: 570, y: 320, kind: 'main', dungeonId: null, tierLabel: 'TIER II · PROTOTYPE', chapterId: 'chapter-ii', prototype: true },
  { id: 'prototype-area-06', actId: 'act-1', name: 'Prototype Area 06', description: 'Temporary navigation prototype used to validate future Act structure.', x: 610, y: 155, kind: 'branch', dungeonId: null, tierLabel: 'TIER II · PROTOTYPE', chapterId: 'chapter-ii', prototype: true },
  { id: 'prototype-area-07', actId: 'act-1', name: 'Prototype Area 07', description: 'Temporary navigation prototype used to validate future Act structure.', x: 650, y: 490, kind: 'branch', dungeonId: null, tierLabel: 'TIER II · PROTOTYPE', chapterId: 'chapter-ii', prototype: true },
  { id: 'prototype-area-08', actId: 'act-1', name: 'Prototype Area 08', description: 'Temporary navigation prototype used to validate future Act structure.', x: 830, y: 320, kind: 'main', dungeonId: null, tierLabel: 'TIER II · PROTOTYPE', chapterId: 'chapter-iii', prototype: true },
  { id: 'prototype-area-09', actId: 'act-1', name: 'Prototype Area 09', description: 'Temporary navigation prototype used to validate future Act structure.', x: 930, y: 165, kind: 'branch', dungeonId: null, tierLabel: 'TIER II · PROTOTYPE', chapterId: 'chapter-iii', prototype: true },
  { id: 'prototype-finale-10', actId: 'act-1', name: 'Prototype Finale 10', description: 'Temporary navigation prototype used to validate future Act structure.', x: 1110, y: 320, kind: 'final', dungeonId: null, tierLabel: 'TIER II · PROTOTYPE', chapterId: 'chapter-iii', prototype: true },
] as const

export const COMBAT_ACT_DEFINITIONS: readonly CombatActDefinition[] = [
  {
    id: 'act-0', label: 'ACT 0', title: 'PROLOGUE', subtitle: 'THE FIRST FRONTIER', description: 'Follow the living leyline from the tower to the forgotten depths.',
    unlock: { type: 'always' }, stage: { width: 1000, height: 460 }, nodes: [...act0Nodes],
    connections: [{ from: 'whispering-woods', to: 'howling-den', kind: 'main' }, { from: 'howling-den', to: 'abandoned-catacombs', kind: 'main' }],
  },
  {
    id: 'act-1', label: 'ACT 1', title: 'THE NEXT FRONTIER', subtitle: 'PROGRESSION PROTOTYPE', description: 'A blueprint for the next campaign arc. The route is visible, but its content has not been authored.',
    unlock: { type: 'boss-kill', bossId: 'archmage-edrin-shade', kills: 1 }, stage: { width: 1280, height: 620 }, nodes: [...act1Nodes],
    connections: [
      { from: 'prototype-area-01', to: 'prototype-area-03', kind: 'main' }, { from: 'prototype-area-03', to: 'prototype-area-05', kind: 'main' },
      { from: 'prototype-area-05', to: 'prototype-area-08', kind: 'main' }, { from: 'prototype-area-08', to: 'prototype-finale-10', kind: 'main' },
      { from: 'prototype-area-01', to: 'prototype-area-02', kind: 'branch' }, { from: 'prototype-area-03', to: 'prototype-area-04', kind: 'branch' },
      { from: 'prototype-area-05', to: 'prototype-area-06', kind: 'branch' }, { from: 'prototype-area-05', to: 'prototype-area-07', kind: 'branch' },
      { from: 'prototype-area-08', to: 'prototype-area-09', kind: 'branch' },
    ],
    chapters: [{ id: 'chapter-i', label: 'CHAPTER I', startX: 80, endX: 390 }, { id: 'chapter-ii', label: 'CHAPTER II', startX: 420, endX: 760 }, { id: 'chapter-iii', label: 'CHAPTER III', startX: 790, endX: 1190 }],
  },
]

export const getCombatActDefinition = (actId: string) => COMBAT_ACT_DEFINITIONS.find((act) => act.id === actId)
