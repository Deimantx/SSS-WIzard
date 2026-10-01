import { authoredCombatLocation } from './combatLocationAuthoring'

export const BLACK_GATE_DUNGEON = authoredCombatLocation('black-gate', 'The Black Gate', ['gatebound-remnant', 'black-rift-stalker', 'portalbound-acolyte', 'sealbreaker-construct'], 'black-gatekeeper', 0, { type: 'all-boss-kills', bossIds: ['unspoken-prelate', 'sigil-warden'] }, 'The final gate into the Shattered Frontier, guarded by the silence beyond the portal.', { encounterSequence: ['gatebound-remnant', 'black-rift-stalker', 'portalbound-acolyte', 'sealbreaker-construct'] })
