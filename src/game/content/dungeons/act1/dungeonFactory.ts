import type { DungeonDefinition } from '../dungeons'

export const act1Dungeon = (
  id: DungeonDefinition['id'],
  name: string,
  monsterPool: DungeonDefinition['monsterPool'],
  boss: DungeonDefinition['boss'],
  threatRequired: number,
  unlock: NonNullable<DungeonDefinition['unlock']>,
  description: string,
  options: Pick<DungeonDefinition, 'encounterSequence'> = {},
): DungeonDefinition => ({
  id,
  name,
  monsterPool,
  threatRequired,
  boss,
  encounterDelayMs: 5000,
  unlock,
  ...options,
  ui: { description },
})
