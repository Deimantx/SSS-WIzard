import { ACT1_MONSTERS } from './act1Monsters'
export const CROSSROADS_OF_RUIN_MONSTERS = Object.fromEntries(['remnant-marauder', 'arcane-binder', 'broken-construct', 'rift-archer', 'crossroads-keeper'].map((id) => [id, ACT1_MONSTERS[id as keyof typeof ACT1_MONSTERS]]))
