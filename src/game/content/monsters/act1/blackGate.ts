import { ACT1_MONSTERS } from './act1Monsters'
export const BLACK_GATE_MONSTERS = Object.fromEntries(['gatebound-remnant', 'black-rift-stalker', 'portalbound-acolyte', 'sealbreaker-construct', 'black-gatekeeper'].map((id) => [id, ACT1_MONSTERS[id as keyof typeof ACT1_MONSTERS]]))
