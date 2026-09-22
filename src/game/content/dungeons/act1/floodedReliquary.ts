import { act1Dungeon } from './dungeonFactory'

export const FLOODED_RELIQUARY_DUNGEON = act1Dungeon('flooded-reliquary', 'Flooded Reliquary', ['drowned-acolyte', 'reliquary-slime', 'mist-wraith', 'rune-leech', 'tidefang-serpent', 'brinebound-sentinel', 'abyssal-archivist'], 'drowned-keeper', 20000, { type: 'boss-kill', bossId: 'corrupted-elemental-gatekeeper' }, 'A drowned archive where cold water preserves rites that should have been forgotten.')
