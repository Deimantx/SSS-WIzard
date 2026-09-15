import type { DungeonDefinition } from '../dungeons'

export const WHISPERING_WOODS_DUNGEON = {
  id: 'whispering-woods', name: 'Whispering Woods', monsterPool: ['forest-wisp', 'thornling', 'stone-root', 'grove-sentinel'], threatRequired: 20, boss: 'forest-heart', encounterDelayMs: 5000, unlock: { type: 'always' }, ui: { description: 'A restless grove where living roots and arcane wisps guard the Forest Heart.' },
} satisfies DungeonDefinition
