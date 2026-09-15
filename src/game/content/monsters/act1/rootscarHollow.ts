import { ACT1_MONSTERS } from './act1Monsters'
export const ROOTSCAR_HOLLOW_MONSTERS = Object.fromEntries(['thorn-maw', 'rootbound-stalker', 'briar-sprite', 'moss-carapace', 'rootscar-ancient'].map((id) => [id, ACT1_MONSTERS[id as keyof typeof ACT1_MONSTERS]]))
