import type { DungeonDefinition } from '../dungeons'

export const ABANDONED_CATACOMBS_DUNGEON = {
  encounterSequence: ['restless-skeleton', 'grave-wraith', 'fallen-acolyte'],
  id: 'abandoned-catacombs', name: 'Abandoned Catacombs', monsterPool: ['restless-skeleton', 'grave-wraith', 'fallen-acolyte'], threatRequired: 30, boss: 'archmage-edrin-shade', encounterDelayMs: 5000, unlock: { type: 'boss-kill', bossId: 'corrupted-greatbear' }, completesTutorial: true, ui: { description: 'A dead mage’s tomb-complex where spirits and forgotten magic still linger.' },
} satisfies DungeonDefinition
