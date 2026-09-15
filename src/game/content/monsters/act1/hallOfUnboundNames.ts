import { ACT1_MONSTERS } from './act1Monsters'
export const HALL_OF_UNBOUND_NAMES_MONSTERS = Object.fromEntries(['name-eater', 'bound-echo', 'hollow-liturgist', 'whisper-archivist', 'unspoken-prelate'].map((id) => [id, ACT1_MONSTERS[id as keyof typeof ACT1_MONSTERS]]))
