import { ACT1_MONSTERS } from './act1Monsters'
export const STARFALLEN_OBSERVATORY_MONSTERS = Object.fromEntries(['starbound-eye', 'astral-husk', 'orbiting-fragment', 'lenskeeper-remnant', 'fallen-astromancer'].map((id) => [id, ACT1_MONSTERS[id as keyof typeof ACT1_MONSTERS]]))
