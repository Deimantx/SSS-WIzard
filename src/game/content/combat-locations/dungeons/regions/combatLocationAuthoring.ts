import type { BossDungeonDefinition, DungeonDefinition, DungeonUnlockCondition } from '../../dungeons'
import type { CombatLocationId } from '../../../../types'

export const authoredCombatLocation = <Id extends CombatLocationId>(
  id: Id,
  name: string,
  monsterPool: BossDungeonDefinition['monsterPool'],
  boss: BossDungeonDefinition['boss'],
  threatRequired: number,
  unlock: DungeonUnlockCondition,
  description: string,
  options: Pick<DungeonDefinition, 'encounterSequence'> = {},
): BossDungeonDefinition & { id: Id } => ({
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
