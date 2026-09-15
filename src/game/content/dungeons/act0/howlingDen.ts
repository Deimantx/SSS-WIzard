import type { DungeonDefinition } from '../dungeons'

export const HOWLING_DEN_DUNGEON = {
  id: 'howling-den', name: 'Howling Den', monsterPool: ['cavefang-wolf', 'razorclaw-lynx', 'corrupted-dire-wolf'], threatRequired: 25, boss: 'corrupted-greatbear', encounterDelayMs: 5000, unlock: { type: 'boss-kill', bossId: 'forest-heart' }, ui: { description: 'A predator-haunted den twisted by unstable magic.' },
} satisfies DungeonDefinition
