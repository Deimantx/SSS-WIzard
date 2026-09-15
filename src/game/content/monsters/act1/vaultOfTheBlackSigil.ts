import { ACT1_MONSTERS } from './act1Monsters'
export const VAULT_OF_THE_BLACK_SIGIL_MONSTERS = Object.fromEntries(['sigil-guardian', 'black-seal-parasite', 'vault-devourer', 'inkbound-specter', 'sigil-warden'].map((id) => [id, ACT1_MONSTERS[id as keyof typeof ACT1_MONSTERS]]))
