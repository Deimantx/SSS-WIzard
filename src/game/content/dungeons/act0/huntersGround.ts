import type { DungeonDefinition } from '../dungeons'

export const HUNTERS_GROUND_DUNGEON = {
  id: 'hunters-ground', name: 'Gloamridge Hunting Ground',
  monsterPool: ['ashen-tracker', 'gloamfang-stalker', 'runehorn-brute'],
  threatRequired: 16000, boss: 'nightglass-alpha', encounterDelayMs: 5000,
  unlock: { type: 'boss-kill', bossId: 'corrupted-greatbear' },
  ui: { description: 'A marked ridge where the Order trains new trackers. A valid Hunt Contract is required to engage its quarry.' },
} satisfies DungeonDefinition
