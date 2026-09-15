import { ACT1_MONSTERS } from './act1Monsters'
export const ASHEN_WATCH_MONSTERS = Object.fromEntries(['cinder-hound', 'ash-cultist', 'fire-elemental', 'lava-eel', 'flamebound-revenant'].map((id) => [id, ACT1_MONSTERS[id as keyof typeof ACT1_MONSTERS]]))
