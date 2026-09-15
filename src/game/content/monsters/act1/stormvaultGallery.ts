import { ACT1_MONSTERS } from './act1Monsters'
export const STORMVAULT_GALLERY_MONSTERS = Object.fromEntries(['volt-wisp', 'static-armor', 'gale-scribe', 'charged-seeker', 'storm-archivist'].map((id) => [id, ACT1_MONSTERS[id as keyof typeof ACT1_MONSTERS]]))
