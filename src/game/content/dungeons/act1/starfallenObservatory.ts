import { act1Dungeon } from './dungeonFactory'

export const STARFALLEN_OBSERVATORY_DUNGEON = act1Dungeon('starfallen-observatory', 'Starfallen Observatory', ['starbound-eye', 'astral-husk', 'orbiting-fragment', 'lenskeeper-remnant', 'comet-wraith', 'voidglass-custodian', 'zenith-horror'], 'fallen-astromancer', 30000, { type: 'boss-kill', bossId: 'crossroads-keeper' }, 'An observatory shattered by a star that refused to stay in the sky.')
