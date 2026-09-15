import { ACT1_MONSTERS } from './act1Monsters'
export const FLOODED_RELIQUARY_MONSTERS = Object.fromEntries(['drowned-acolyte', 'reliquary-slime', 'mist-wraith', 'rune-leech', 'drowned-keeper'].map((id) => [id, ACT1_MONSTERS[id as keyof typeof ACT1_MONSTERS]]))
