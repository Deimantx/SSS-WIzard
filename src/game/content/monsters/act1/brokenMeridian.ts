import { ACT1_MONSTERS } from './act1Monsters'
export const BROKEN_MERIDIAN_MONSTERS = Object.fromEntries(['meridian-warden', 'fractured-channeler', 'arc-surge-horror', 'linebreaker-shade', 'meridian-splitter'].map((id) => [id, ACT1_MONSTERS[id as keyof typeof ACT1_MONSTERS]]))
