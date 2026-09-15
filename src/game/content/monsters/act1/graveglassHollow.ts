import { ACT1_MONSTERS } from './act1Monsters'
export const GRAVEGLASS_HOLLOW_MONSTERS = Object.fromEntries(['graveglass-shade', 'bone-shardling', 'silent-mourner', 'crypt-guardian', 'graveglass-behemoth'].map((id) => [id, ACT1_MONSTERS[id as keyof typeof ACT1_MONSTERS]]))
