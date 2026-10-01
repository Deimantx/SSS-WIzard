import type { DungeonDefinition } from '../../dungeons'

export const HUNTERS_GROUND_DUNGEON = {
  id: 'hunters-ground', name: 'Gloamridge',
  monsterPool: ['ashen-tracker', 'gloamfang-stalker', 'runehorn-brute', 'veilwing-harrier', 'cinderback-mauler', 'gloomroot-hexer', 'nightglass-alpha'],
  threatRequired: null, boss: null, encounterDelayMs: 5000,
  unlock: { type: 'boss-kill', bossId: 'corrupted-greatbear' },
  ui: { description: 'A marked hunting ground where the Order tracks its quarry. A matching Hunt Contract authorizes each target.' },
} satisfies DungeonDefinition
