import type { DungeonDefinition } from '../dungeons'

export const WHISPERING_WOODS_DUNGEON = {
  id: 'whispering-woods', name: 'Whispering Woods', monsterPool: ['forest-wisp', 'thornling', 'dewbound-sprite', 'cinder-moth', 'stone-root', 'grove-sentinel', 'tempest-stag'], threatRequired: 5000, boss: 'forest-heart', encounterDelayMs: 5000, unlock: { type: 'always' }, ui: { description: 'A restless grove where living roots, storm-stags, and arcane wisps guard the Forest Heart.' },
} satisfies DungeonDefinition
